namespace Contracts.User.Responses;

/// <summary>
/// API response for UpdateNotificationPreferences operation
/// </summary>
public record UpdateNotificationPreferencesResponse(
    // TODO: Add response properties
    string PlaceholderResult)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}
