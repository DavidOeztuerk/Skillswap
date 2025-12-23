using Events.Integration.VideoCall;
using Microsoft.Extensions.Logging;
using MassTransit;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Configuration;
using NotificationService.Domain.Services;
using NotificationService.Hubs;

namespace NotificationService.Infrastructure.Consumers;

/// <summary>
/// Consumes CallSessionEndedIntegrationEvent to send real-time notifications
/// and session summary emails when a video call ends.
/// </summary>
public class CallSessionEndedIntegrationEventConsumer : IConsumer<CallSessionEndedIntegrationEvent>
{
    private readonly IServiceScopeFactory _serviceScopeFactory;
    private readonly IConfiguration _configuration;
    private readonly IHubContext<NotificationHub> _notificationHub;
    private readonly ILogger<CallSessionEndedIntegrationEventConsumer> _logger;

    public CallSessionEndedIntegrationEventConsumer(
        IServiceScopeFactory serviceScopeFactory,
        IConfiguration configuration,
        IHubContext<NotificationHub> notificationHub,
        ILogger<CallSessionEndedIntegrationEventConsumer> logger)
    {
        _serviceScopeFactory = serviceScopeFactory;
        _configuration = configuration;
        _notificationHub = notificationHub;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<CallSessionEndedIntegrationEvent> context)
    {
        var message = context.Message;
        _logger.LogInformation(
            "Processing CallSessionEndedIntegrationEvent for session {SessionId}, Duration: {Duration}s",
            message.SessionId, message.DurationSeconds);

        try
        {
            // Send real-time notification to both participants
            await Task.WhenAll(
                SendCallEndedNotificationAsync(message, message.InitiatorUserId, context.CancellationToken),
                SendCallEndedNotificationAsync(message, message.ParticipantUserId, context.CancellationToken)
            );

            // Log analytics data
            _logger.LogInformation(
                "VideoCall Analytics - Session {SessionId}: Duration={Duration}s, Participants={ParticipantCount}, " +
                "Messages={MessageCount}, ScreenShare={ScreenShareUsed}",
                message.SessionId, message.DurationSeconds, message.ParticipantCount,
                message.MessageCount, message.ScreenShareUsed);

            _logger.LogInformation(
                "Successfully processed CallSessionEndedIntegrationEvent for session {SessionId}",
                message.SessionId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "Failed to process CallSessionEndedIntegrationEvent for session {SessionId}",
                message.SessionId);
            throw;
        }
    }

    private async Task SendCallEndedNotificationAsync(
        CallSessionEndedIntegrationEvent message,
        string userId,
        CancellationToken cancellationToken)
    {
        try
        {
            var durationMinutes = message.DurationSeconds / 60;

            var notification = new
            {
                type = "VideoCallEnded",
                sessionId = message.SessionId,
                roomId = message.RoomId,
                appointmentId = message.AppointmentId,
                durationSeconds = message.DurationSeconds,
                durationMinutes = durationMinutes,
                participantCount = message.ParticipantCount,
                messageCount = message.MessageCount,
                message = $"Dein Video-Call ist beendet. Dauer: {durationMinutes} Minuten.",
                timestamp = message.EndedAt
            };

            await _notificationHub.Clients
                .User(userId)
                .SendAsync("ReceiveVideoCallNotification", notification, cancellationToken);

            _logger.LogInformation(
                "Sent VideoCallEnded notification to user {UserId} for session {SessionId}",
                userId, message.SessionId);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex,
                "Failed to send VideoCallEnded SignalR notification to user {UserId}.",
                userId);
        }
    }
}
