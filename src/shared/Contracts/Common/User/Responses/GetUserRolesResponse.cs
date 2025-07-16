namespace Contracts.User.Responses;

/// <summary>
/// API response for GetUserRoles operation
/// </summary>
public record GetUserRolesResponse(
    // TODO: Add response properties
    string PlaceholderResult)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}
