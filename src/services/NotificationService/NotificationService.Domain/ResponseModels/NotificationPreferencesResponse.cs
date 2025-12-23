// ============================================================================
// RESPONSE MODELS
// ============================================================================

namespace NotificationService.Domain.ResponseModels;

public class NotificationPreferencesResponse
{
    public string UserId { get; set; } = string.Empty;

    // Email preferences
    public bool EmailEnabled { get; set; }
    public bool EmailMarketing { get; set; }
    public bool EmailSecurity { get; set; }
    public bool EmailUpdates { get; set; }

    // SMS preferences
    public bool SmsEnabled { get; set; }
    public bool SmsSecurity { get; set; }
    public bool SmsReminders { get; set; }

    // Push notification preferences
    public bool PushEnabled { get; set; }
    public bool PushMarketing { get; set; }
    public bool PushSecurity { get; set; }
    public bool PushUpdates { get; set; }

    // Quiet hours
    public TimeOnly? QuietHoursStart { get; set; }
    public TimeOnly? QuietHoursEnd { get; set; }

    public string TimeZone { get; set; } = "UTC";
    public string DigestFrequency { get; set; } = "Daily";
    public string Language { get; set; } = "en";

    public DateTime UpdatedAt { get; set; }
}
