using NotificationService.Domain.Entities;

namespace NotificationService.Domain.Services;

/// <summary>
/// Email service interface for sending emails
/// </summary>
public interface IEmailService
{
    Task<bool> SendEmailAsync(string to, string subject, string htmlContent, string textContent, Dictionary<string, string>? headers = null);
    Task<bool> SendTemplatedEmailAsync(string to, string templateName, Dictionary<string, string> variables, string language = "en");
    Task<EmailTemplate?> GetTemplateAsync(string name, string language = "en");
}
