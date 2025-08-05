using System.ComponentModel.DataAnnotations;

namespace Contracts.User.Requests;

/// <summary>
/// API request for UpdateUserAvailability operation
/// </summary>
public record UpdateUserAvailabilityRequest(
    bool IsAvailable,
    string? StatusMessage)
{
    /// <summary>
    /// API Version this request supports
    /// </summary>
    public string ApiVersion => "v1";
}
