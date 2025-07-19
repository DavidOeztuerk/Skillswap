namespace Contracts.User.Responses;

/// <summary>
/// API response for UpdateUserStatus operation
/// </summary>
public record UpdateUserStatusResponse(
    // TODO: Add response properties
    string PlaceholderResult)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}
