namespace Contracts.User.Responses;

/// <summary>
/// API response for DeleteAvatar operation
/// </summary>
public record DeleteAvatarResponse(
    string UserId,
    bool Success,
    string Message)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}
