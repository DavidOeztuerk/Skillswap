namespace Contracts.User.Responses;

/// <summary>
/// API response for UploadAvatar operation
/// </summary>
public record UploadAvatarResponse(
    string UserId,
    string AvatarUrl,
    DateTime UploadedAt)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}
