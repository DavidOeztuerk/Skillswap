namespace NotificationService.Domain.Entities;

/// <summary>
/// Email template names
/// </summary>
public static class EmailTemplateNames
{
    public const string Welcome = "welcome";
    public const string EmailVerification = "email-verification";
    public const string PasswordReset = "password-reset";
    public const string PasswordChanged = "password-changed";
    public const string AccountSuspended = "account-suspended";
    public const string AccountReactivated = "account-reactivated";
    public const string SecurityAlert = "security-alert";
    public const string SkillMatchFound = "skill-match-found";
    public const string AppointmentReminder = "appointment-reminder";
    public const string AppointmentConfirmation = "appointment-confirmation";
}
