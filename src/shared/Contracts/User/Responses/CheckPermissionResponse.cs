namespace Contracts.User.Responses;

/// <summary>
/// API response for permission check
/// </summary>
public record CheckPermissionResponse(
    bool IsAllowed,
    string? Reason = null,
    List<string>? RequiredPermissions = null,
    List<string>? UserPermissions = null)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}