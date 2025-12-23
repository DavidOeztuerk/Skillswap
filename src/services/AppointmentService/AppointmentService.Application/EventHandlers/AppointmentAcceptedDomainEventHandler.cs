using AppointmentService.Domain.Repositories;
using AppointmentService.Domain.Services;
using Events.Domain.Appointment;
using Events.Integration.AppointmentManagement;
using MassTransit;
using MediatR;
using Microsoft.Extensions.Logging;

namespace AppointmentService.Application.EventHandlers;

/// <summary>
/// Handles AppointmentAcceptedDomainEvent and publishes AppointmentAcceptedIntegrationEvent
/// to notify other services (especially NotificationService) about the accepted appointment.
/// </summary>
public class AppointmentAcceptedDomainEventHandler : INotificationHandler<AppointmentAcceptedDomainEvent>
{
    private readonly IPublishEndpoint _publishEndpoint;
    private readonly IAppointmentDataEnrichmentService _enrichmentService;
    private readonly IAppointmentUnitOfWork _unitOfWork;
    private readonly ILogger<AppointmentAcceptedDomainEventHandler> _logger;

    public AppointmentAcceptedDomainEventHandler(
        IPublishEndpoint publishEndpoint,
        IAppointmentDataEnrichmentService enrichmentService,
        IAppointmentUnitOfWork unitOfWork,
        ILogger<AppointmentAcceptedDomainEventHandler> logger)
    {
        _publishEndpoint = publishEndpoint;
        _enrichmentService = enrichmentService;
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task Handle(AppointmentAcceptedDomainEvent notification, CancellationToken cancellationToken)
    {
        _logger.LogInformation("📧 [EventHandler] Received AppointmentAcceptedDomainEvent for appointment {AppointmentId}", notification.AppointmentId);
        _logger.LogDebug("📋 [EventHandler] Event details - AcceptedByUserId: {AcceptedByUserId}, OtherParticipantId: {OtherParticipantId}, SkillId: {SkillId}, BothPartiesAccepted: {BothPartiesAccepted}",
            notification.AcceptedByUserId, notification.OtherParticipantId, notification.SkillId, notification.BothPartiesAccepted);

        try
        {
            // Load the appointment with related data for enrichment
            _logger.LogInformation("📂 [EventHandler] Loading appointment with SessionSeries for enrichment");
            var appointment = await _unitOfWork.SessionAppointments.GetWithSeriesAsync(
                notification.AppointmentId,
                cancellationToken);

            if (appointment == null)
            {
                _logger.LogWarning("⚠️ [EventHandler] Cannot publish integration event - Appointment {AppointmentId} not found", notification.AppointmentId);
                return;
            }

            _logger.LogInformation("✅ [EventHandler] Appointment loaded successfully");

            // Enrich appointment data with user and skill information
            _logger.LogInformation("🔄 [EventHandler] Starting data enrichment (fetching user & skill details)");
            var enrichedData = await _enrichmentService.EnrichAppointmentDataAsync(appointment, cancellationToken);
            _logger.LogInformation("✅ [EventHandler] Data enrichment completed");

            // Map Domain Event properties to Integration Event
            // AcceptedByUserId = Participant (the one who accepted)
            // OtherParticipantId = Organizer (the one who sent the invitation)
            var participantUserId = notification.AcceptedByUserId;
            var organizerUserId = notification.OtherParticipantId;

            _logger.LogInformation("👥 [EventHandler] Mapping users - Participant (Accepted): {ParticipantUserId}, Organizer: {OrganizerUserId}",
                participantUserId, organizerUserId);

            _logger.LogDebug("📧 [EventHandler] Integration Event data:");
            _logger.LogDebug("   - OrganizerEmail: {OrganizerEmail}, OrganizerName: {OrganizerName}",
                enrichedData.Organizer?.Email ?? "FALLBACK", $"{enrichedData.Organizer?.FirstName} {enrichedData.Organizer?.LastName}");
            _logger.LogDebug("   - ParticipantEmail: {ParticipantEmail}, ParticipantName: {ParticipantName}",
                enrichedData.Participant?.Email ?? "FALLBACK", $"{enrichedData.Participant?.FirstName} {enrichedData.Participant?.LastName}");
            _logger.LogDebug("   - SkillId: {SkillId}, SkillName: {SkillName}",
                enrichedData.Skill?.SkillId ?? "NULL", enrichedData.Skill?.Name ?? "FALLBACK");
            _logger.LogDebug("   - MeetingLink: {MeetingLink}", enrichedData.MeetingLink ?? "NULL");

            // Publish integration event for NotificationService
            _logger.LogInformation("📡 [EventHandler] Publishing AppointmentAcceptedIntegrationEvent to RabbitMQ");
            await _publishEndpoint.Publish(new AppointmentAcceptedIntegrationEvent
            {
                AppointmentId = notification.AppointmentId,
                ScheduledDate = notification.ScheduledDate,
                DurationMinutes = notification.DurationMinutes,
                MeetingLink = enrichedData.MeetingLink,

                // Organizer Information
                OrganizerUserId = organizerUserId,
                OrganizerEmail = enrichedData.Organizer?.Email ?? $"user_{organizerUserId}@skillswap.com",
                OrganizerFirstName = enrichedData.Organizer?.FirstName ?? "Unknown",
                OrganizerLastName = enrichedData.Organizer?.LastName ?? "User",
                OrganizerPhoneNumber = enrichedData.Organizer?.PhoneNumber,

                // Participant Information (the one who accepted)
                ParticipantUserId = participantUserId,
                ParticipantEmail = enrichedData.Participant?.Email ?? $"user_{participantUserId}@skillswap.com",
                ParticipantFirstName = enrichedData.Participant?.FirstName ?? "Unknown",
                ParticipantLastName = enrichedData.Participant?.LastName ?? "User",
                ParticipantPhoneNumber = enrichedData.Participant?.PhoneNumber,

                // Skill Information
                SkillId = enrichedData.Skill?.SkillId ?? notification.SkillId,
                SkillName = enrichedData.Skill?.Name ?? "Unknown Skill",
                SkillCategory = enrichedData.Skill?.Category,
                SkillDescription = enrichedData.Skill?.Description,

                // Metadata
                AcceptedAt = DateTime.UtcNow,
                BothPartiesAccepted = notification.BothPartiesAccepted
            }, cancellationToken);

            _logger.LogInformation("✅ [EventHandler] AppointmentAcceptedIntegrationEvent published successfully to RabbitMQ for appointment {AppointmentId}", notification.AppointmentId);
            _logger.LogInformation("📬 [EventHandler] NotificationService should now receive the event and send emails");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "❌ [EventHandler] FAILED to publish AppointmentAcceptedIntegrationEvent for appointment {AppointmentId}. Error: {ErrorMessage}. StackTrace: {StackTrace}",
                notification.AppointmentId, ex.Message, ex.StackTrace);
            // Don't throw - this is a notification handler and should not break the main flow
        }
    }
}
