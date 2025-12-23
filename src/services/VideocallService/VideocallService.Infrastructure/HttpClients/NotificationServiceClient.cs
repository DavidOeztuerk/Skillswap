using Infrastructure.Communication;
using Contracts.Notification.Requests;
using Contracts.Notification.Responses;
using VideocallService.Domain.Services;
using Microsoft.Extensions.Logging;

namespace VideocallService.Infrastructure.HttpClients;

public class NotificationServiceClient : INotificationServiceClient
{
    private readonly IServiceCommunicationManager _serviceCommunication;
    private readonly ILogger<NotificationServiceClient> _logger;

    public NotificationServiceClient(IServiceCommunicationManager serviceCommunication, ILogger<NotificationServiceClient> logger)
    {
        _serviceCommunication = serviceCommunication;
        _logger = logger;
    }

    public async Task<bool> SendVideoCallStartedNotificationAsync(string userId, string callId, string callerName, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogDebug("Sending video call started notification to user {UserId} for call {CallId}", userId, callId);

            var request = new SendNotificationRequest(
                Type: "Push",
                Template: "VideoCallStarted",
                Recipient: userId,
                Variables: new Dictionary<string, string>
                {
                    ["callId"] = callId,
                    ["callerName"] = callerName,
                    ["startedAt"] = DateTime.UtcNow.ToString("O"),
                    ["title"] = "Video Call Started",
                    ["message"] = $"Video call with {callerName} has started"
                });

            var response = await _serviceCommunication.SendRequestAsync<SendNotificationRequest, SendNotificationResponse>(
                "notificationservice",
                "api/notifications/send",
                request,
                cancellationToken);

            var success = response != null;
            _logger.LogDebug("Video call started notification sent: {Success}", success);
            return success;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending video call started notification for call {CallId}", callId);
            return false;
        }
    }

    public async Task<bool> SendVideoCallEndedNotificationAsync(string userId, string callId, int durationMinutes, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogDebug("Sending video call ended notification to user {UserId} for call {CallId}", userId, callId);

            var request = new SendNotificationRequest(
                Type: "Push",
                Template: "VideoCallEnded",
                Recipient: userId,
                Variables: new Dictionary<string, string>
                {
                    ["callId"] = callId,
                    ["durationMinutes"] = durationMinutes.ToString(),
                    ["endedAt"] = DateTime.UtcNow.ToString("O"),
                    ["title"] = "Video Call Ended",
                    ["message"] = $"Video call ended. Duration: {durationMinutes} minutes"
                });

            var response = await _serviceCommunication.SendRequestAsync<SendNotificationRequest, SendNotificationResponse>(
                "notificationservice",
                "api/notifications/send",
                request,
                cancellationToken);

            var success = response != null;
            _logger.LogDebug("Video call ended notification sent: {Success}", success);
            return success;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending video call ended notification for call {CallId}", callId);
            return false;
        }
    }

    public async Task<bool> SendVideoCallInvitationNotificationAsync(string userId, string callId, string inviterName, string meetingLink, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogDebug("Sending video call invitation notification to user {UserId} for call {CallId}", userId, callId);

            var request = new SendNotificationRequest(
                Type: "Push",
                Template: "VideoCallInvitation",
                Recipient: userId,
                Variables: new Dictionary<string, string>
                {
                    ["callId"] = callId,
                    ["inviterName"] = inviterName,
                    ["meetingLink"] = meetingLink,
                    ["invitedAt"] = DateTime.UtcNow.ToString("O"),
                    ["title"] = "Video Call Invitation",
                    ["message"] = $"{inviterName} is inviting you to a video call"
                });

            var response = await _serviceCommunication.SendRequestAsync<SendNotificationRequest, SendNotificationResponse>(
                "notificationservice",
                "api/notifications/send",
                request,
                cancellationToken);

            var success = response != null;
            _logger.LogDebug("Video call invitation notification sent: {Success}", success);
            return success;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending video call invitation notification for call {CallId}", callId);
            return false;
        }
    }

    public async Task<bool> SendVideoCallMissedNotificationAsync(string userId, string callId, string callerName, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogDebug("Sending video call missed notification to user {UserId} for call {CallId}", userId, callId);

            var request = new SendNotificationRequest(
                Type: "Push",
                Template: "VideoCallMissed",
                Recipient: userId,
                Variables: new Dictionary<string, string>
                {
                    ["callId"] = callId,
                    ["callerName"] = callerName,
                    ["missedAt"] = DateTime.UtcNow.ToString("O"),
                    ["title"] = "Missed Video Call",
                    ["message"] = $"You missed a video call from {callerName}"
                });

            var response = await _serviceCommunication.SendRequestAsync<SendNotificationRequest, SendNotificationResponse>(
                "notificationservice",
                "api/notifications/send",
                request,
                cancellationToken);

            var success = response != null;
            _logger.LogDebug("Video call missed notification sent: {Success}", success);
            return success;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending video call missed notification for call {CallId}", callId);
            return false;
        }
    }
}