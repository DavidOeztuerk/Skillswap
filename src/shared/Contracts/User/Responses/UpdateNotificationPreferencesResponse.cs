namespace Contracts.User.Responses;

/// <summary>
/// API response for UpdateNotificationPreferences operation
/// </summary>
public record UpdateNotificationPreferencesResponse(
    string UserId,
    bool Success,
    DateTime UpdatedAt)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}
