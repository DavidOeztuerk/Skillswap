using AppointmentService.Domain.Services;
using Events.Integration.Matchmaking;
using Events.Integration.Appointment;
using MassTransit;
using Infrastructure.Caching;
using Microsoft.Extensions.Logging;

namespace AppointmentService.Application.EventHandlers;

/// <summary>
/// Handles MatchAcceptedIntegrationEvent from MatchmakingService
/// Creates the complete session hierarchy: Connection → SessionSeries → SessionAppointments
/// </summary>
public class MatchAcceptedIntegrationEventHandler : IConsumer<MatchAcceptedIntegrationEvent>
{
    private readonly ISessionOrchestrationService _sessionOrchestrationService;
    private readonly IUserServiceClient _userServiceClient;
    private readonly IPublishEndpoint _publishEndpoint;
    private readonly IDistributedCacheService _cacheService;
    private readonly ILogger<MatchAcceptedIntegrationEventHandler> _logger;

    public MatchAcceptedIntegrationEventHandler(
        ISessionOrchestrationService sessionOrchestrationService,
        IUserServiceClient userServiceClient,
        IPublishEndpoint publishEndpoint,
        IDistributedCacheService cacheService,
        ILogger<MatchAcceptedIntegrationEventHandler> logger)
    {
        _sessionOrchestrationService = sessionOrchestrationService;
        _userServiceClient = userServiceClient;
        _publishEndpoint = publishEndpoint;
        _cacheService = cacheService;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<MatchAcceptedIntegrationEvent> context)
    {
        var message = context.Message;
        _logger.LogInformation(
            "Received MatchAcceptedIntegrationEvent. Creating session hierarchy for match: {MatchId}, TotalSessions: {TotalSessions}",
            message.MatchId, message.TotalSessions);

        try
        {
            // NOTE: SessionOrchestrationService now handles the entire hierarchy creation
            // It creates: Connection → SessionSeries → SessionAppointments with meeting links
            // This is a massive simplification compared to the old 450+ line implementation

            var connection = await _sessionOrchestrationService.CreateSessionHierarchyFromMatchAsync(
                matchRequestId: message.MatchId,
                requesterId: message.RequesterId,
                targetUserId: message.TargetUserId,
                skillId: message.SkillId,
                isSkillExchange: message.IsSkillExchange,
                exchangeSkillId: message.ExchangeSkillId,
                isMonetary: message.IsMonetary,
                offeredAmount: message.AgreedAmount,
                currency: message.Currency,
                totalSessions: message.TotalSessions,
                sessionDurationMinutes: message.SessionDurationMinutes,
                preferredDays: message.PreferredDays ?? Array.Empty<string>(),
                preferredTimes: message.PreferredTimes ?? Array.Empty<string>(),
                cancellationToken: context.CancellationToken);

            _logger.LogInformation(
                "Session hierarchy created successfully. ConnectionId: {ConnectionId}, MatchId: {MatchId}",
                connection.Id, message.MatchId);

            // INVALIDATE CACHE for both users - they have new appointments
            try
            {
                // FIX: Match the actual cache key pattern used in queries
                await _cacheService.RemoveByPatternAsync(
                    $"user-appointments:{message.RequesterId}:*",
                    context.CancellationToken);

                await _cacheService.RemoveByPatternAsync(
                    $"user-appointments:{message.TargetUserId}:*",
                    context.CancellationToken);

                // Also invalidate appointment details cache
                await _cacheService.RemoveByPatternAsync(
                    $"appointment-details:*",
                    context.CancellationToken);

                _logger.LogInformation(
                    "Invalidated appointment cache for users {RequesterId} and {TargetUserId}",
                    message.RequesterId, message.TargetUserId);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex,
                    "Failed to invalidate appointment cache for users {RequesterId} and {TargetUserId}. Cache will expire naturally.",
                    message.RequesterId, message.TargetUserId);
            }

            // Fetch user profiles for notification
            var organizerProfile = await _userServiceClient.GetUserProfileAsync(
                message.RequesterId,
                context.CancellationToken);

            var participantProfile = await _userServiceClient.GetUserProfileAsync(
                message.TargetUserId,
                context.CancellationToken);

            // Load all session appointments created for this connection
            var allAppointments = new List<AppointmentSummary>();

            foreach (var series in connection.SessionSeries)
            {
                foreach (var appointment in series.SessionAppointments)
                {
                    var teacherRole = DetermineTeacherRole(
                        series.TeacherUserId,
                        message.RequesterId,
                        message.IsSkillExchange);

                    allAppointments.Add(new AppointmentSummary(
                        appointment.Id,
                        appointment.Title,
                        appointment.ScheduledDate,
                        appointment.DurationMinutes,
                        appointment.SessionNumber,
                        series.TotalSessions,
                        appointment.MeetingLink ?? string.Empty,
                        appointment.Status,
                        teacherRole));
                }
            }

            // Publish integration event for NotificationService
            await _publishEndpoint.Publish(new AppointmentsCreatedIntegrationEvent(
                message.MatchId,
                message.RequesterId,
                organizerProfile?.Email ?? string.Empty,
                $"{organizerProfile?.FirstName} {organizerProfile?.LastName}".Trim(),
                message.TargetUserId,
                participantProfile?.Email ?? string.Empty,
                $"{participantProfile?.FirstName} {participantProfile?.LastName}".Trim(),
                message.SkillName,
                message.IsSkillExchange,
                message.ExchangeSkillName,
                message.IsMonetary,
                message.AgreedAmount,
                message.Currency,
                allAppointments.ToArray(),
                DateTime.UtcNow),
                context.CancellationToken);

            _logger.LogInformation(
                "Published AppointmentsCreatedIntegrationEvent for match {MatchId} with {Count} appointments",
                message.MatchId, allAppointments.Count);

            _logger.LogInformation(
                "Successfully processed MatchAcceptedIntegrationEvent for match {MatchId}",
                message.MatchId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "Error processing MatchAcceptedIntegrationEvent for match {MatchId}",
                message.MatchId);

            throw;
        }
    }

    /// <summary>
    /// Determines who teaches in a given session for skill exchange scenarios
    /// </summary>
    private string? DetermineTeacherRole(string teacherUserId, string requesterId, bool isSkillExchange)
    {
        if (!isSkillExchange)
            return null;

        // For skill exchange, each series has a teacher
        // If the teacher is the requester, they are the "Organizer"
        // If the teacher is the target user, they are the "Participant"
        return teacherUserId == requesterId ? "Organizer" : "Participant";
    }
}