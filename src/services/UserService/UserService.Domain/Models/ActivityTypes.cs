namespace UserService.Domain.Models;

/// <summary>
/// Activity type constants
/// </summary>
public static class ActivityTypes
{
    public const string Login = "Login";
    public const string Logout = "Logout";
    public const string PasswordChange = "PasswordChange";
    public const string ProfileUpdate = "ProfileUpdate";
    public const string EmailVerification = "EmailVerification";
    public const string PasswordReset = "PasswordReset";
    public const string AccountSuspension = "AccountSuspension";
    public const string RoleChange = "RoleChange";
    public const string FailedLogin = "FailedLogin";
    public const string SuspiciousActivity = "SuspiciousActivity";
}