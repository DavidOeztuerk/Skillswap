namespace Contracts.User.Responses;

/// <summary>
/// API response for GetBlockedUsers operation
/// </summary>
public record GetBlockedUsersResponse(
    // TODO: Add response properties
    string PlaceholderResult)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}
