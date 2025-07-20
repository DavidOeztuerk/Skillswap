using System.ComponentModel.DataAnnotations;

namespace Contracts.User.Requests;

/// <summary>
/// API request for creating audit log entry
/// </summary>
public record AuditLogRequest(
    [Required(ErrorMessage = "User ID is required")]
    string UserId,

    [Required(ErrorMessage = "Action is required")]
    string Action,

    [Required(ErrorMessage = "Resource type is required")]
    string ResourceType,

    string? ResourceId = null,

    string? IpAddress = null,

    string? UserAgent = null,

    Dictionary<string, object>? Metadata = null,

    bool Success = true)
{
    /// <summary>
    /// API Version this request supports
    /// </summary>
    public string ApiVersion => "v1";
}