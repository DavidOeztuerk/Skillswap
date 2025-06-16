namespace NotificationService.Infrastructure.Services;

// ============================================================================
// SMS SERVICE INTERFACE & IMPLEMENTATION
// ============================================================================

public interface ISmsService
{
    Task<bool> SendSmsAsync(string to, string message);
    Task<bool> SendTemplatedSmsAsync(string to, string templateName, Dictionary<string, string> variables);
}
