namespace NotificationService.Domain.ResponseModels;

public record ReminderSettingsResponse
{
    public string Id { get; init; } = string.Empty;
    public string UserId { get; init; } = string.Empty;
    public int[] ReminderMinutesBefore { get; init; } = Array.Empty<int>();
    public bool EmailRemindersEnabled { get; init; }
    public bool PushRemindersEnabled { get; init; }
    public bool SmsRemindersEnabled { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime? UpdatedAt { get; init; }
}

public record ScheduledReminderResponse
{
    public string Id { get; init; } = string.Empty;
    public string AppointmentId { get; init; } = string.Empty;
    public string UserId { get; init; } = string.Empty;
    public string ReminderType { get; init; } = string.Empty;
    public DateTime ScheduledFor { get; init; }
    public int MinutesBefore { get; init; }
    public string Status { get; init; } = string.Empty;
    public DateTime? SentAt { get; init; }
    public string? PartnerName { get; init; }
    public string? SkillName { get; init; }
    public DateTime? AppointmentTime { get; init; }
}
