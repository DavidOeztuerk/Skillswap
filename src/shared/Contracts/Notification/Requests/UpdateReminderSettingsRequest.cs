namespace Contracts.Notification.Requests;

public record UpdateReminderSettingsRequest
{
    public int[] ReminderMinutesBefore { get; init; } = Array.Empty<int>();
    public bool EmailRemindersEnabled { get; init; } = true;
    public bool PushRemindersEnabled { get; init; } = true;
    public bool SmsRemindersEnabled { get; init; } = false;
}
