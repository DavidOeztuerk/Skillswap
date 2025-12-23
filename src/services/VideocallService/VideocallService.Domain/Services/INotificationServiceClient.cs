namespace VideocallService.Domain.Services;

public interface INotificationServiceClient
{
    Task<bool> SendVideoCallStartedNotificationAsync(string userId, string callId, string callerName, CancellationToken cancellationToken = default);
    Task<bool> SendVideoCallEndedNotificationAsync(string userId, string callId, int durationMinutes, CancellationToken cancellationToken = default);
    Task<bool> SendVideoCallInvitationNotificationAsync(string userId, string callId, string inviterName, string meetingLink, CancellationToken cancellationToken = default);
    Task<bool> SendVideoCallMissedNotificationAsync(string userId, string callId, string callerName, CancellationToken cancellationToken = default);
}
