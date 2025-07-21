namespace Contracts.User.Responses;

/// <summary>
/// API response for BlockUser operation
/// </summary>
public record BlockUserResponse(
    string UserId,
    string BlockedUserId,
    DateTime BlockedAt,
    string Message)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}
