namespace Contracts.User.Responses.Auth;

/// <summary>
/// User permissions and roles information
/// </summary>
public record UserPermissions(
    string UserId,
    List<string> Roles,
    List<string> PermissionNames,
    Dictionary<string, List<string>> PermissionsByCategory)
{
    public static UserPermissions Empty(string userId) => new(
        userId,
        new List<string>(),
        new List<string>(),
        new Dictionary<string, List<string>>()
    );
}