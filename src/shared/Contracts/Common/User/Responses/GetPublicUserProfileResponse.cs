namespace Contracts.User.Responses;

/// <summary>
/// API response for GetPublicUserProfile operation
/// </summary>
public record GetPublicUserProfileResponse(
    // TODO: Add response properties
    string PlaceholderResult)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}
