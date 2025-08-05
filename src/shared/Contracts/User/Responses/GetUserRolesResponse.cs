namespace Contracts.User.Responses;

/// <summary>
/// API response for GetUserRoles operation
/// </summary>
public record GetUserRolesResponse(
    string UserId,
    List<string> Roles)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}
