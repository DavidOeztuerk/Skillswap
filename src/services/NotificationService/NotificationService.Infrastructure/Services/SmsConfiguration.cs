namespace NotificationService.Infrastructure.Services;

public class SmsConfiguration
{
    public string TwilioAccountSid { get; set; } = string.Empty;
    public string TwilioAuthToken { get; set; } = string.Empty;
    public string FromNumber { get; set; } = string.Empty;
}