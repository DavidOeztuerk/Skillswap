using AppointmentService.Application.Commands;
using AppointmentService.Domain.Entities;
using AppointmentService.Domain.Repositories;
using AppointmentService.Domain.Services;
using Contracts.Appointment.Responses;
using CQRS.Handlers;
using CQRS.Models;
using Events.Domain.Appointment;
using EventSourcing;
using Microsoft.Extensions.Logging;

namespace AppointmentService.Application.CommandHandlers;

/// <summary>
/// Handles CreateAppointmentCommand by creating a full session hierarchy:
/// Connection → SessionSeries → SessionAppointment
/// This replaces the legacy Appointment table approach
/// </summary>
public class CreateAppointmentCommandHandler(
    IAppointmentUnitOfWork unitOfWork,
    IMeetingLinkService meetingLinkService,
    IDomainEventPublisher eventPublisher,
    ILogger<CreateAppointmentCommandHandler> logger)
    : BaseCommandHandler<CreateAppointmentCommand, CreateAppointmentResponse>(logger)
{
    private readonly IAppointmentUnitOfWork _unitOfWork = unitOfWork;
    private readonly IMeetingLinkService _meetingLinkService = meetingLinkService;
    private readonly IDomainEventPublisher _eventPublisher = eventPublisher;
    private readonly ILogger<CreateAppointmentCommandHandler> _logger = logger;

    public override async Task<ApiResponse<CreateAppointmentResponse>> Handle(
        CreateAppointmentCommand request,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation(
            "📅 CreateAppointmentCommandHandler: Creating manual appointment for User {UserId}, Title: {Title}, ScheduledDate: {ScheduledDate}",
            request.UserId, request.Title, request.ScheduledDate);

        try
        {
            // STEP 1: Check if Connection already exists for these two users + skill
            _logger.LogInformation(
                "🔍 Checking if Connection already exists between users {UserId} and {ParticipantUserId} for skill {SkillId}",
                request.UserId, request.ParticipantUserId, request.SkillId);

            var existingConnections = await _unitOfWork.Connections.GetByUserAsync(request.UserId!, cancellationToken);
            var connection = existingConnections.FirstOrDefault(c =>
                (c.RequesterId == request.UserId && c.TargetUserId == request.ParticipantUserId ||
                 c.RequesterId == request.ParticipantUserId && c.TargetUserId == request.UserId) &&
                c.SkillId == request.SkillId &&
                c.IsActive);

            // STEP 2: Create new Connection if it doesn't exist
            if (connection == null)
            {
                _logger.LogInformation(
                    "➕ No active Connection found. Creating new Connection for manual appointment (OneTimeSession)");

                // For manual appointments, we create a simple "Free" connection type
                // MatchRequestId is set to a generated value since this is a manual appointment
                var matchRequestId = $"manual-{Guid.NewGuid()}";

                connection = Connection.Create(
                    matchRequestId: matchRequestId,
                    requesterId: request.UserId!,
                    targetUserId: request.ParticipantUserId,
                    connectionType: ConnectionType.Free,
                    skillId: request.SkillId ?? "general", // Default to "general" if no skill specified
                    exchangeSkillId: null,
                    paymentRatePerHour: null,
                    currency: null
                );

                await _unitOfWork.Connections.CreateAsync(connection, cancellationToken);
                await _unitOfWork.SaveChangesAsync(cancellationToken);

                _logger.LogInformation("✅ Connection created with ID: {ConnectionId}", connection.Id);
            }
            else
            {
                _logger.LogInformation(
                    "✅ Found existing Connection: {ConnectionId}. Using it for the appointment.",
                    connection.Id);
            }

            // STEP 3: Create SessionSeries (for manual appointments, TotalSessions = 1)
            _logger.LogInformation("📚 Creating SessionSeries for this appointment...");

            var sessionSeries = SessionSeries.Create(
                connectionId: connection.Id,
                title: request.Title,
                teacherUserId: request.UserId!, // Organizer is the teacher
                learnerUserId: request.ParticipantUserId,
                skillId: request.SkillId ?? "general",
                totalSessions: 1, // Manual appointments are single-session
                defaultDurationMinutes: request.DurationMinutes,
                description: request.Description
            );

            await _unitOfWork.SessionSeries.CreateAsync(sessionSeries, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("✅ SessionSeries created with ID: {SeriesId}", sessionSeries.Id);

            // Update connection's total planned sessions
            connection.TotalSessionsPlanned += 1;
            await _unitOfWork.Connections.UpdateAsync(connection, cancellationToken);

            // STEP 4: Create SessionAppointment
            _logger.LogInformation("📝 Creating SessionAppointment...");

            var sessionAppointment = SessionAppointment.Create(
                sessionSeriesId: sessionSeries.Id,
                title: request.Title,
                scheduledDate: request.ScheduledDate,
                durationMinutes: request.DurationMinutes,
                sessionNumber: 1,
                organizerUserId: request.UserId!,
                participantUserId: request.ParticipantUserId,
                description: request.Description
            );

            // Set meeting type
            if (!string.IsNullOrEmpty(request.MeetingType))
            {
                sessionAppointment.MeetingType = request.MeetingType;
            }

            await _unitOfWork.SessionAppointments.CreateAsync(sessionAppointment, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("✅ SessionAppointment created with ID: {AppointmentId}", sessionAppointment.Id);

            // STEP 5: Generate meeting link if it's a video call
            if (request.MeetingType == "VideoCall" || request.MeetingType == "Online")
            {
                try
                {
                    _logger.LogInformation("🔗 Generating meeting link for appointment {AppointmentId}...", sessionAppointment.Id);
                    var meetingLink = await _meetingLinkService.GenerateMeetingLinkAsync(
                        sessionAppointment.Id,
                        cancellationToken);

                    sessionAppointment.UpdateMeetingLink(meetingLink);
                    await _unitOfWork.SessionAppointments.UpdateAsync(sessionAppointment, cancellationToken);
                    await _unitOfWork.SaveChangesAsync(cancellationToken);

                    _logger.LogInformation("✅ Meeting link generated: {MeetingLink}", meetingLink);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex,
                        "⚠️ Failed to generate meeting link for appointment {AppointmentId}. Will be generated later.",
                        sessionAppointment.Id);
                    // Don't fail the entire command if meeting link generation fails
                }
            }

            // STEP 6: Publish SessionScheduledEvent (not legacy AppointmentCreatedEvent)
            _logger.LogInformation("📢 Publishing SessionScheduledEvent...");
            await _eventPublisher.Publish(new SessionScheduledEvent(
                sessionAppointment.Id,
                sessionSeries.Id,
                sessionAppointment.ScheduledDate,
                sessionAppointment.OrganizerUserId,
                sessionAppointment.ParticipantUserId
            ), cancellationToken);

            // STEP 7: Return response
            var response = new CreateAppointmentResponse(
                sessionAppointment.Id,
                sessionAppointment.Title,
                sessionAppointment.ScheduledDate,
                sessionAppointment.Status,
                sessionAppointment.CreatedAt);

            _logger.LogInformation(
                "🎉 Manual appointment created successfully! SessionAppointmentId: {AppointmentId}, ConnectionId: {ConnectionId}, SeriesId: {SeriesId}",
                sessionAppointment.Id, connection.Id, sessionSeries.Id);

            return Success(response, "Appointment created successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "❌ Error creating manual appointment for User {UserId}, Participant {ParticipantUserId}",
                request.UserId, request.ParticipantUserId);

            return Error($"Failed to create appointment: {ex.Message}");
        }
    }
}
