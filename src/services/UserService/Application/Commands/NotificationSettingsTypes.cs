namespace UserService.Application.Commands;

public record EmailNotificationSettings(
    bool SkillRequests,
    bool SkillMatches,
    bool AppointmentReminders,
    bool PasswordChanges,
    bool SecurityAlerts,
    bool WeeklyDigest);

public record PushNotificationSettings(
    bool SkillRequests,
    bool SkillMatches,
    bool AppointmentReminders,
    bool ChatMessages,
    bool SecurityAlerts);

public record InAppNotificationSettings(
    bool SkillRequests,
    bool SkillMatches,
    bool AppointmentReminders,
    bool ChatMessages,
    bool SystemUpdates);
