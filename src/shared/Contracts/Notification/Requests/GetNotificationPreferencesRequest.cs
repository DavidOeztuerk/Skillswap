using Contracts.Common;

namespace Contracts.Notification.Requests;

/// <summary>
/// API request for getting notification preferences
/// This request typically doesn't need parameters as it gets preferences for the authenticated user
/// </summary>
public record GetNotificationPreferencesRequest() 
    : IVersionedContract
{
    /// <summary>
    /// API Version this request supports
    /// </summary>
    public string ApiVersion => "v1";
}
