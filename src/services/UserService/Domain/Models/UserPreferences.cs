namespace UserService.Domain.Models;

/// <summary>
/// User preferences helper class
/// </summary>
public class UserPreferences
{
    public string Language { get; set; } = "en";
    public string Theme { get; set; } = "light";
    public bool EmailNotifications { get; set; } = true;
    public bool SmsNotifications { get; set; } = false;
    public bool PushNotifications { get; set; } = true;
    public string DateFormat { get; set; } = "MM/dd/yyyy";
    public string TimeFormat { get; set; } = "12h";
    public bool ShowOnlineStatus { get; set; } = true;
    public Dictionary<string, bool> PrivacySettings { get; set; } = new();
    public Dictionary<string, string> CustomSettings { get; set; } = new();
}
