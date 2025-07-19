using System.ComponentModel.DataAnnotations;

namespace Contracts.User.Requests;

/// <summary>
/// API request for UpdateNotificationPreferences operation
/// </summary>
public record UpdateNotificationPreferencesRequest(
    // TODO: Add request parameters with validation
    string PlaceholderParam)
{
    /// <summary>
    /// API Version this request supports
    /// </summary>
    public string ApiVersion => "v1";
}
