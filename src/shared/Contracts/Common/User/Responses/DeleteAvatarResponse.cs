namespace Contracts.User.Responses;

/// <summary>
/// API response for DeleteAvatar operation
/// </summary>
public record DeleteAvatarResponse(
    // TODO: Add response properties
    string PlaceholderResult)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}
