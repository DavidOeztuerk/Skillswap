using Contracts.Common;

namespace Contracts.Notification.Responses;

/// <summary>
/// API response for UpdateNotificationPreferences operation
/// </summary>
public record UpdateNotificationPreferencesResponse(
    string UserId,
    DateTime UpdatedAt)
    : IVersionedContract
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}

