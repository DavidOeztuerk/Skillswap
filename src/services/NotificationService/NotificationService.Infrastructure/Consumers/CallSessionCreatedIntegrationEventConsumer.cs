using Events.Integration.VideoCall;
using Microsoft.Extensions.Logging;
using MassTransit;
using Microsoft.AspNetCore.SignalR;
using NotificationService.Hubs;

namespace NotificationService.Infrastructure.Consumers;

/// <summary>
/// Consumes CallSessionCreatedIntegrationEvent to send real-time notifications
/// when a video call session is created and ready to join.
/// </summary>
public class CallSessionCreatedIntegrationEventConsumer : IConsumer<CallSessionCreatedIntegrationEvent>
{
    private readonly IHubContext<NotificationHub> _notificationHub;
    private readonly ILogger<CallSessionCreatedIntegrationEventConsumer> _logger;

    public CallSessionCreatedIntegrationEventConsumer(
        IHubContext<NotificationHub> notificationHub,
        ILogger<CallSessionCreatedIntegrationEventConsumer> logger)
    {
        _notificationHub = notificationHub;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<CallSessionCreatedIntegrationEvent> context)
    {
        var message = context.Message;
        _logger.LogInformation(
            "Processing CallSessionCreatedIntegrationEvent for session {SessionId}, Room {RoomId}",
            message.SessionId, message.RoomId);

        try
        {
            // Send real-time notification to the participant (the person being called)
            await SendCallReadyNotificationAsync(message, context.CancellationToken);

            _logger.LogInformation(
                "Successfully processed CallSessionCreatedIntegrationEvent for session {SessionId}",
                message.SessionId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "Failed to process CallSessionCreatedIntegrationEvent for session {SessionId}",
                message.SessionId);
            throw;
        }
    }

    private async Task SendCallReadyNotificationAsync(
        CallSessionCreatedIntegrationEvent message,
        CancellationToken cancellationToken)
    {
        try
        {
            var initiatorName = message.InitiatorName ?? "Someone";

            var notification = new
            {
                type = "VideoCallReady",
                sessionId = message.SessionId,
                roomId = message.RoomId,
                appointmentId = message.AppointmentId,
                matchId = message.MatchId,
                initiatorUserId = message.InitiatorUserId,
                initiatorName = initiatorName,
                message = $"{initiatorName} hat einen Video-Call gestartet. Klicke um beizutreten.",
                timestamp = DateTime.UtcNow
            };

            // Notify the participant that a call is ready
            await _notificationHub.Clients
                .User(message.ParticipantUserId)
                .SendAsync("ReceiveVideoCallNotification", notification, cancellationToken);

            _logger.LogInformation(
                "Sent VideoCallReady notification to participant {ParticipantUserId} for session {SessionId}",
                message.ParticipantUserId, message.SessionId);
        }
        catch (Exception ex)
        {
            // SignalR failure should not break the process
            _logger.LogWarning(ex,
                "Failed to send VideoCallReady SignalR notification to user {UserId}. User may not be connected.",
                message.ParticipantUserId);
        }
    }
}
