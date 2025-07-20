using System.ComponentModel.DataAnnotations;

namespace Contracts.User.Requests;

/// <summary>
/// API request for checking user permissions
/// </summary>
public record CheckPermissionRequest(
    [Required(ErrorMessage = "User ID is required")]
    string UserId,

    [Required(ErrorMessage = "Resource is required")]
    string Resource,

    [Required(ErrorMessage = "Action is required")]
    string Action,

    string? ResourceId = null,

    Dictionary<string, string>? Context = null)
{
    /// <summary>
    /// API Version this request supports
    /// </summary>
    public string ApiVersion => "v1";
}