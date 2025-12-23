namespace NotificationService.Domain.Services;

/// <summary>
/// SMS service interface for sending text messages
/// </summary>
public interface ISmsService
{
    Task<bool> SendSmsAsync(string to, string message);
    Task<bool> SendTemplatedSmsAsync(string to, string templateName, Dictionary<string, string> variables);
}
