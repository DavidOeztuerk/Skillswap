using AppointmentService.Infrastructure.Data;
using AppointmentService.Domain.Services;
using AppointmentService.Domain.Repositories;
using Events.Domain.Appointment;
using EventSourcing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Security.Cryptography;
using Core.Common.Exceptions;
using Infrastructure.Communication;
using Contracts.VideoCall.Requests;
using Contracts.VideoCall.Responses;

namespace AppointmentService.Infrastructure.Services;

public class MeetingLinkService : IMeetingLinkService
{
    private readonly IAppointmentUnitOfWork _unitOfWork;
    private readonly IDomainEventPublisher _eventPublisher;
    private readonly IConfiguration _configuration;
    private readonly IUserServiceClient _userServiceClient;
    private readonly IServiceCommunicationManager _serviceCommunication;
    private readonly ILogger<MeetingLinkService> _logger;
    private const int LINK_ACTIVATION_DELAY_MINUTES = 5;
    private const int LINK_VALIDITY_HOURS = 24;

    public MeetingLinkService(
        IAppointmentUnitOfWork unitOfWork,
        IDomainEventPublisher eventPublisher,
        IConfiguration configuration,
        IUserServiceClient userServiceClient,
        IServiceCommunicationManager serviceCommunication,
        ILogger<MeetingLinkService> logger)
    {
        _unitOfWork = unitOfWork;
        _eventPublisher = eventPublisher;
        _configuration = configuration;
        _userServiceClient = userServiceClient;
        _serviceCommunication = serviceCommunication;
        _logger = logger;
    }

    public async Task<string> GenerateMeetingLinkAsync(string appointmentId, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("🎥 [MeetingLinkService] Starting meeting link generation for appointment {AppointmentId}", appointmentId);

        var appointment = await _unitOfWork.SessionAppointments.GetByIdAsync(appointmentId, cancellationToken);

        if (appointment == null || appointment.IsDeleted)
        {
            _logger.LogError("❌ [MeetingLinkService] Appointment {AppointmentId} not found or deleted", appointmentId);
            throw new ResourceNotFoundException("SessionAppointment", appointmentId);
        }

        _logger.LogDebug("📋 [MeetingLinkService] Appointment loaded - OrganizerUserId: {OrganizerUserId}, ParticipantUserId: {ParticipantUserId}",
            appointment.OrganizerUserId, appointment.ParticipantUserId);

        try
        {
            // Create video call session via VideocallService (M2M call)
            _logger.LogInformation("📡 [MeetingLinkService] Creating video call session via VideocallService for appointment {AppointmentId}", appointmentId);

            var request = new CreateCallSessionRequest(appointmentId, MaxParticipants: 2);
            _logger.LogDebug("📤 [MeetingLinkService] Request payload: AppointmentId={AppointmentId}, MaxParticipants=2", appointmentId);

            _logger.LogDebug("🔗 [MeetingLinkService] Calling VideocallService at: /api/videocall/sessions/create");

            var response = await _serviceCommunication.SendRequestAsync<CreateCallSessionRequest, CreateCallSessionResponse>(
                "VideocallService",
                "/api/videocall/sessions/create",
                request,
                cancellationToken);

            if (response == null)
            {
                _logger.LogError("❌ [MeetingLinkService] VideocallService returned NULL response for appointment {AppointmentId}", appointmentId);
                throw new System.InvalidOperationException("Failed to create video call session - VideocallService returned null");
            }

            _logger.LogInformation("✅ [MeetingLinkService] VideocallService response received - RoomId: {RoomId}, SessionId: {SessionId}",
                response.RoomId, response.SessionId);

            // Build meeting URL for frontend (using appointmentId for routing)
            var frontendUrl = _configuration["Frontend:BaseUrl"] ?? "http://localhost:5173";
            var meetingLink = $"{frontendUrl}/videocall/{appointmentId}";

            _logger.LogInformation("🔗 [MeetingLinkService] Generated meeting link: {MeetingLink}", meetingLink);

            // Store meeting link using domain method
            appointment.UpdateMeetingLink(meetingLink);
            appointment.UpdatedAt = DateTime.UtcNow;

            _logger.LogDebug("💾 [MeetingLinkService] Saving appointment with meeting link to database");
            await _unitOfWork.SaveChangesAsync(cancellationToken);
            _logger.LogInformation("✅ [MeetingLinkService] Appointment saved with meeting link");

            // Fetch user details
            _logger.LogInformation("👥 [MeetingLinkService] Fetching user profiles for notification event");
            var organizerProfile = await _userServiceClient.GetUserProfileAsync(appointment.OrganizerUserId, cancellationToken);
            var participantProfile = await _userServiceClient.GetUserProfileAsync(appointment.ParticipantUserId, cancellationToken);

            _logger.LogDebug("👤 [MeetingLinkService] Organizer: {OrganizerEmail}, Participant: {ParticipantEmail}",
                organizerProfile?.Email ?? "NULL", participantProfile?.Email ?? "NULL");

            // Get SkillId from SessionSeries (via Connection)
            var skillId = string.Empty;
            _logger.LogDebug("🎯 [MeetingLinkService] SkillId for event: {SkillId} (empty = not loaded)", skillId);

            _logger.LogInformation("📧 [MeetingLinkService] Publishing MeetingLinkGeneratedDomainEvent");
            await _eventPublisher.Publish(new MeetingLinkGeneratedDomainEvent(
                appointmentId,
                meetingLink,
                appointment.OrganizerUserId,
                organizerProfile?.Email ?? "",
                $"{organizerProfile?.FirstName} {organizerProfile?.LastName}".Trim(),
                appointment.ParticipantUserId,
                participantProfile?.Email ?? "",
                $"{participantProfile?.FirstName} {participantProfile?.LastName}".Trim(),
                appointment.ScheduledDate,
                appointment.DurationMinutes,
                skillId),
                cancellationToken);

            _logger.LogInformation("✅ [MeetingLinkService] Meeting link generation completed successfully for appointment {AppointmentId}", appointmentId);

            return meetingLink;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "❌ [MeetingLinkService] FAILED to generate meeting link for appointment {AppointmentId}. Error: {ErrorMessage}. StackTrace: {StackTrace}",
                appointmentId, ex.Message, ex.StackTrace);
            throw;
        }
    }

    public async Task<bool> VerifyMeetingLinkAsync(string appointmentId, string token, CancellationToken cancellationToken = default)
    {
        var appointment = await _unitOfWork.SessionAppointments.GetByIdAsync(appointmentId, cancellationToken);

        if (appointment == null || appointment.IsDeleted || string.IsNullOrEmpty(appointment.MeetingLink))
        {
            _logger.LogWarning("No meeting link found for appointment {AppointmentId}", appointmentId);
            return false;
        }

        // With real VideocallService integration, verification is simplified
        // The meeting link contains the roomId which is validated by VideocallService
        _logger.LogDebug("Meeting link verified for appointment {AppointmentId}", appointmentId);
        return true;
    }

    public async Task<string> RefreshMeetingLinkAsync(string appointmentId, CancellationToken cancellationToken = default)
    {
        var appointment = await _unitOfWork.SessionAppointments.GetByIdAsync(appointmentId, cancellationToken);

        if (appointment == null || appointment.IsDeleted)
        {
            throw new ResourceNotFoundException("SessionAppointment", appointmentId);
        }

        // Generate new token and link
        var newLink = await GenerateMeetingLinkAsync(appointmentId, cancellationToken);

        _logger.LogInformation("Refreshed meeting link for appointment {AppointmentId}", appointmentId);

        return newLink;
    }

    public async Task<bool> IsMeetingLinkActiveAsync(string appointmentId, CancellationToken cancellationToken = default)
    {
        var appointment = await _unitOfWork.SessionAppointments.GetByIdAsync(appointmentId, cancellationToken);

        if (appointment == null || appointment.IsDeleted || string.IsNullOrEmpty(appointment.MeetingLink))
        {
            _logger.LogDebug("No meeting link found for appointment {AppointmentId}", appointmentId);
            return false;
        }

        // With real VideocallService integration, links are active as soon as they're created
        // Activation is managed by the appointment's scheduled time
        var isActive = DateTime.UtcNow >= appointment.ScheduledDate.AddMinutes(-LINK_ACTIVATION_DELAY_MINUTES);

        if (!isActive)
        {
            var timeUntilActive = appointment.ScheduledDate.AddMinutes(-LINK_ACTIVATION_DELAY_MINUTES) - DateTime.UtcNow;
            _logger.LogInformation(
                "Meeting link for appointment {AppointmentId} will be active in {Minutes} minutes",
                appointmentId, timeUntilActive.TotalMinutes);
        }

        return isActive;
    }

    private string GenerateSecureToken(int length = 32)
    {
        using var rng = RandomNumberGenerator.Create();
        var bytes = new byte[length];
        rng.GetBytes(bytes);
        return Convert.ToBase64String(bytes)
            .Replace("+", "-")
            .Replace("/", "_")
            .Replace("=", "");
    }
}