using System.ComponentModel.DataAnnotations;

namespace Contracts.User.Requests;

/// <summary>
/// API request for GetUserAvailability operation
/// </summary>
public record GetUserAvailabilityRequest(
    [Required]
    string UserId)
{
    /// <summary>
    /// API Version this request supports
    /// </summary>
    public string ApiVersion => "v1";
}
