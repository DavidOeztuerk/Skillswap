using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MimeKit;
using NotificationService.Domain.Entities;
using NotificationService.Domain.Services;
using NotificationService.Infrastructure.Data;
using Core.Common.Exceptions;

namespace NotificationService.Infrastructure.Services;

public class EmailService(
    ILogger<EmailService> logger,
    IOptions<EmailConfiguration> configuration,
    ITemplateEngine templateEngine,
    NotificationDbContext dbContext)
    : IEmailService
{
    private readonly ILogger<EmailService> _logger = logger;
    private readonly EmailConfiguration _config = configuration.Value
                 ?? throw new ConfigurationException("Email configuration not found");
    private readonly ITemplateEngine _templateEngine = templateEngine;
    private readonly NotificationDbContext _dbContext = dbContext;

    public async Task<bool> SendEmailAsync(string to, string subject, string htmlContent, string textContent, Dictionary<string, string>? headers = null)
    {
        try
        {
            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(_config.FromName, _config.FromAddress));
            message.To.Add(new MailboxAddress("", to));
            message.Subject = subject;

            // Add custom headers
            if (headers != null)
            {
                foreach (var header in headers)
                {
                    message.Headers.Add(header.Key, header.Value);
                }
            }

            var bodyBuilder = new BodyBuilder
            {
                HtmlBody = htmlContent,
                TextBody = textContent
            };

            message.Body = bodyBuilder.ToMessageBody();

            using var client = new SmtpClient();

            // Determine secure socket options based on configuration
            var secureSocketOptions = _config.UseSsl ? SecureSocketOptions.SslOnConnect :
                                     _config.UseStartTls ? SecureSocketOptions.StartTls :
                                     SecureSocketOptions.Auto;
            
            await client.ConnectAsync(_config.SmtpHost, _config.SmtpPort, secureSocketOptions);

            if (!string.IsNullOrEmpty(_config.Username))
            {
                await client.AuthenticateAsync(_config.Username, _config.Password);
            }

            await client.SendAsync(message);
            await client.DisconnectAsync(true);

            _logger.LogInformation("Email sent successfully to {Recipient}", to);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email to {Recipient}", to);
            return false;
        }
    }

    public async Task<bool> SendTemplatedEmailAsync(string to, string templateName, Dictionary<string, string> variables, string language = "en")
    {
        try
        {
            var template = await GetTemplateAsync(templateName, language);
            if (template == null)
            {
                _logger.LogError("Template {TemplateName} not found for language {Language}", templateName, language);
                return false;
            }

            var subject = _templateEngine.RenderTemplate(template.Subject, variables);
            var htmlContent = _templateEngine.RenderTemplate(template.HtmlContent, variables);
            var textContent = _templateEngine.RenderTemplate(template.TextContent, variables);

            return await SendEmailAsync(to, subject, htmlContent, textContent);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send templated email {TemplateName} to {Recipient}", templateName, to);
            return false;
        }
    }

    public async Task<EmailTemplate?> GetTemplateAsync(string name, string language = "en")
    {
        try
        {
            // First try to get template from database
            var template = await _dbContext.EmailTemplates
                .Where(t => t.Name == name && t.Language == language && t.IsActive && !t.IsDeleted)
                .OrderByDescending(t => t.Version)
                .FirstOrDefaultAsync();

            if (template != null)
            {
                _logger.LogDebug("Template {TemplateName} found in database for language {Language}", name, language);
                return template;
            }

            // If not found in database, try English as fallback
            if (language != "en")
            {
                template = await _dbContext.EmailTemplates
                    .Where(t => t.Name == name && t.Language == "en" && t.IsActive && !t.IsDeleted)
                    .OrderByDescending(t => t.Version)
                    .FirstOrDefaultAsync();

                if (template != null)
                {
                    _logger.LogDebug("Template {TemplateName} not found in {Language}, using English fallback", name, language);
                    return template;
                }
            }

            // If still not found, use minimal fallback as last resort
            _logger.LogWarning("Template {TemplateName} not found in database, using minimal fallback", name);
            return GetMinimalFallbackTemplate(name, language);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving template {TemplateName} from database", name);
            // Return minimal fallback template
            return GetMinimalFallbackTemplate(name, language);
        }
    }

    /// <summary>
    /// Returns a minimal fallback template when database is unavailable
    /// This should only be used as an absolute last resort when:
    /// 1. Database is down
    /// 2. Templates haven't been seeded
    /// 3. Network issues prevent DB access
    /// </summary>
    private static EmailTemplate GetMinimalFallbackTemplate(string name, string language)
    {
        // These are MINIMAL templates - real templates come from the database via the seeder
        var (subject, htmlContent, textContent) = name switch
        {
            "email-verification" => (
                "Please verify your email address",
                "<p>Hi {{FirstName}},</p><p>Please verify your email by clicking: <a href='{{VerificationUrl}}'>Verify Email</a></p><p><strong>This link expires in 72 hours.</strong></p>",
                "Hi {{FirstName}}, please verify your email: {{VerificationUrl}} (expires in 72 hours)"
            ),
            "appointment-confirmation" => (
                "Your SkillSwap session is confirmed",
                "<p>Hi {{RecipientFirstName}},</p><p>Your session for <strong>{{SkillName}}</strong> is confirmed:</p><ul><li>Date: {{ScheduledDate}}</li><li>Time: {{ScheduledTime}}</li><li>Duration: {{DurationMinutes}} minutes</li></ul><p>Meeting link: <a href='{{MeetingLink}}'>Join Meeting</a></p>",
                "Your {{SkillName}} session is confirmed for {{ScheduledDate}} at {{ScheduledTime}}. Meeting link: {{MeetingLink}}"
            ),
            "appointment-rescheduled" => (
                "Your SkillSwap session has been rescheduled",
                "<p>Hi {{RecipientFirstName}},</p><p>Your session has been rescheduled:</p><p><strong>New time:</strong> {{NewScheduledDate}} at {{NewScheduledTime}}</p><p>Reason: {{Reason}}</p>",
                "Your session has been rescheduled to {{NewScheduledDate}} at {{NewScheduledTime}}. Reason: {{Reason}}"
            ),
            "password-reset" => (
                "Reset your SkillSwap password",
                "<p>Hi {{FirstName}},</p><p>Reset your password: <a href='{{ResetUrl}}'>Reset Password</a></p><p>This link expires in 1 hour.</p>",
                "Hi {{FirstName}}, reset your password: {{ResetUrl}} (expires in 1 hour)"
            ),
            "welcome" => (
                "Welcome to SkillSwap!",
                "<p>Welcome {{FirstName}}!</p><p>We're excited to have you join SkillSwap. Get started at <a href='{{AppUrl}}'>{{AppUrl}}</a></p>",
                "Welcome {{FirstName}}! Get started at {{AppUrl}}"
            ),
            _ => (
                "SkillSwap Notification",
                "<p>{{Content}}</p>",
                "{{Content}}"
            )
        };

        return new EmailTemplate
        {
            Id = Guid.NewGuid().ToString(),
            Name = name,
            Language = language,
            Subject = subject,
            HtmlContent = htmlContent,
            TextContent = textContent,
            IsActive = true,
            Version = "1.0",  // This is a string
            Description = "Emergency fallback template - database unavailable",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
    }
}
