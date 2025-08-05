using System.ComponentModel.DataAnnotations;

namespace Contracts.User.Requests;

/// <summary>
/// API request for UpdateUserStatus operation (Admin)
/// </summary>
public record UpdateUserStatusRequest(
    [Required]
    string UserId,
    [Required]
    string NewStatus, // e.g., Active, Suspended, Banned
    string? Reason = null)
{
    /// <summary>
    /// API Version this request supports
    /// </summary>
    public string ApiVersion => "v1";
}
