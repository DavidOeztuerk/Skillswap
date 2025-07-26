using System.ComponentModel.DataAnnotations;
using Contracts.Common;

namespace Contracts.Notification.Requests;

/// <summary>
/// API request for updating notification preferences
/// </summary>
/// <param name="EmailEnabled">Enable/disable email notifications</param>
/// <param name="EmailMarketing">Enable/disable email marketing</param>
/// <param name="EmailSecurity">Enable/disable email security notifications</param>
/// <param name="EmailUpdates">Enable/disable email updates</param>
/// <param name="SmsEnabled">Enable/disable SMS notifications</param>
/// <param name="SmsSecurity">Enable/disable SMS security notifications</param>
/// <param name="SmsReminders">Enable/disable SMS reminders</param>
/// <param name="PushEnabled">Enable/disable push notifications</param>
/// <param name="PushMarketing">Enable/disable push marketing</param>
/// <param name="PushSecurity">Enable/disable push security notifications</param>
/// <param name="PushUpdates">Enable/disable push updates</param>
/// <param name="QuietHoursStart">Start time for quiet hours</param>
/// <param name="QuietHoursEnd">End time for quiet hours</param>
/// <param name="TimeZone">User timezone</param>
/// <param name="DigestFrequency">Email digest frequency</param>
/// <param name="Language">Preferred language</param>
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
    string? Language = null) : IVersionedContract
{
    /// <summary>
    /// API Version this request supports
    /// </summary>
    public string ApiVersion => "v1";
}
