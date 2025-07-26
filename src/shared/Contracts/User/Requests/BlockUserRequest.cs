namespace Contracts.User.Requests;

/// <summary>
/// API request for BlockUser operation
/// </summary>
public record BlockUserRequest(
    string BlockedUserId,
    string? Reason = null)
{
    /// <summary>
    /// API Version this request supports
    /// </summary>
    public string ApiVersion => "v1";
}
