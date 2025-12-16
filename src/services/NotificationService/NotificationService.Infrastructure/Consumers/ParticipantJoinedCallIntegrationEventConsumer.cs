using Events.Integration.VideoCall;
using Microsoft.Extensions.Logging;
using MassTransit;
using Microsoft.AspNetCore.SignalR;
using NotificationService.Hubs;

namespace NotificationService.Infrastructure.Consumers;

/// <summary>
/// Consumes ParticipantJoinedCallIntegrationEvent to send real-time notifications
/// when a participant joins a video call.
/// </summary>
public class ParticipantJoinedCallIntegrationEventConsumer : IConsumer<ParticipantJoinedCallIntegrationEvent>
{
    private readonly IHubContext<NotificationHub> _notificationHub;
    private readonly ILogger<ParticipantJoinedCallIntegrationEventConsumer> _logger;

    public ParticipantJoinedCallIntegrationEventConsumer(
        IHubContext<NotificationHub> notificationHub,
        ILogger<ParticipantJoinedCallIntegrationEventConsumer> logger)
    {
        _notificationHub = notificationHub;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<ParticipantJoinedCallIntegrationEvent> context)
    {
        var message = context.Message;
        _logger.LogInformation(
            "Processing ParticipantJoinedCallIntegrationEvent - User {UserId} joined session {SessionId}",
            message.UserId, message.SessionId);

        try
        {
            // Broadcast to all users in the room that someone joined
            await SendParticipantJoinedNotificationAsync(message, context.CancellationToken);

            _logger.LogInformation(
                "Successfully processed ParticipantJoinedCallIntegrationEvent for session {SessionId}",
                message.SessionId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "Failed to process ParticipantJoinedCallIntegrationEvent for session {SessionId}",
                message.SessionId);
            throw;
        }
    }

    private async Task SendParticipantJoinedNotificationAsync(
        ParticipantJoinedCallIntegrationEvent message,
        CancellationToken cancellationToken)
    {
        try
        {
            var userName = message.UserName ?? "A participant";

            var notification = new
            {
                type = "ParticipantJoinedCall",
                sessionId = message.SessionId,
                roomId = message.RoomId,
                userId = message.UserId,
                userName = userName,
                cameraEnabled = message.CameraEnabled,
                microphoneEnabled = message.MicrophoneEnabled,
                message = $"{userName} ist dem Video-Call beigetreten.",
                timestamp = message.JoinedAt
            };

            // Broadcast to the room group
            await _notificationHub.Clients
                .Group($"videocall:{message.RoomId}")
                .SendAsync("ReceiveVideoCallNotification", notification, cancellationToken);

            _logger.LogInformation(
                "Sent ParticipantJoinedCall notification to room {RoomId} for user {UserId}",
                message.RoomId, message.UserId);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex,
                "Failed to send ParticipantJoinedCall SignalR notification for room {RoomId}.",
                message.RoomId);
        }
    }
}
