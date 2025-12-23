namespace Contracts.Notification.Requests;

public record RegisterPushTokenRequest
{
    public string Token { get; init; } = string.Empty;
}
