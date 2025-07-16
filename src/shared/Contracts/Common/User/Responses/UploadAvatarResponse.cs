namespace Contracts.User.Responses;

/// <summary>
/// API response for UploadAvatar operation
/// </summary>
public record UploadAvatarResponse(
    // TODO: Add response properties
    string PlaceholderResult)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}
