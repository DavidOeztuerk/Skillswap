using System.ComponentModel.DataAnnotations;

namespace Contracts.User.Requests;

/// <summary>
/// API request for UpdateNotificationPreferences operation
/// </summary>
public record UpdateNotificationPreferencesRequest(
    bool? EmailEnabled = null,
    bool? EmailMarketing = null,
    bool? EmailSecurity = null,
    bool? EmailUpdates = null,
    bool? SmsEnabled = null,
    bool? SmsSecurity = null,
    bool? SmsReminders = null,
    bool? PushEnabled = null,
    bool? PushMarketing = null,
    bool? PushSecurity = null,
    bool? PushUpdates = null,
    TimeOnly? QuietHoursStart = null,
    TimeOnly? QuietHoursEnd = null,
    string? TimeZone = null,
    string? DigestFrequency = null,
    string? Language = null)
{
    /// <summary>
    /// API Version this request supports
    /// </summary>
    public string ApiVersion => "v1";
}
