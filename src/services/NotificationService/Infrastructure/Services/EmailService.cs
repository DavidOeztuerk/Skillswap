using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;
using NotificationService.Domain.Entities;

namespace NotificationService.Infrastructure.Services;

public class EmailService : IEmailService
{
    private readonly ILogger<EmailService> _logger;
    private readonly EmailConfiguration _config;
    private readonly ITemplateEngine _templateEngine;

    public EmailService(
        ILogger<EmailService> logger,
        IConfiguration configuration,
        ITemplateEngine templateEngine)
    {
        _logger = logger;
        _templateEngine = templateEngine;
        _config = configuration.GetSection("Email").Get<EmailConfiguration>()
                 ?? throw new InvalidOperationException("Email configuration not found");
    }

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

            await client.ConnectAsync(_config.SmtpHost, _config.SmtpPort,
                _config.UseSsl ? SecureSocketOptions.SslOnConnect : SecureSocketOptions.StartTls);

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
        // This would typically query a database
        // For now, return a simple template
        await Task.Delay(1); // Simulate async operation

        return new EmailTemplate
        {
            Name = name,
            Language = language,
            Subject = GetDefaultSubject(name),
            HtmlContent = GetDefaultHtmlContent(name),
            TextContent = GetDefaultTextContent(name)
        };
    }

    private static string GetDefaultSubject(string templateName) => templateName switch
    {
        "welcome" => "Welcome to SkillSwap! 🎉",
        "email-verification" => "Please verify your email address",
        "password-reset" => "Reset your SkillSwap password",
        "password-changed" => "Your password has been changed",
        "account-suspended" => "Your account has been suspended",
        "account-reactivated" => "Your account has been reactivated",
        "security-alert" => "Security Alert - Unusual activity detected",
        "skill-match-found" => "New skill match found! 🚀",
        "appointment-reminder" => "Reminder: Your skill session is tomorrow",
        "appointment-confirmation" => "Your skill session has been confirmed",
        _ => "SkillSwap Notification"
    };

    private static string GetDefaultHtmlContent(string templateName) => templateName switch
    {
        "welcome" => """
            <h1>Welcome to SkillSwap, {{FirstName}}!</h1>
            <p>We're excited to have you join our community of learners and teachers.</p>
            <p>Start by <a href="{{AppUrl}}/skills">exploring skills</a> or <a href="{{AppUrl}}/profile">completing your profile</a>.</p>
            """,
        "email-verification" => """
            <h1>Verify your email address</h1>
            <p>Hi {{FirstName}},</p>
            <p>Please click the button below to verify your email address:</p>
            <a href="{{VerificationUrl}}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Verify Email</a>
            <p>This link will expire in 24 hours.</p>
            """,
        "password-reset" => """
            <h1>Reset your password</h1>
            <p>Hi {{FirstName}},</p>
            <p>You requested to reset your password. Click the button below:</p>
            <a href="{{ResetUrl}}" style="background: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
            <p>This link will expire in 1 hour.</p>
            """,
        _ => "<p>{{Content}}</p>"
    };

    private static string GetDefaultTextContent(string templateName) => templateName switch
    {
        "welcome" => "Welcome to SkillSwap, {{FirstName}}! We're excited to have you join our community.",
        "email-verification" => "Hi {{FirstName}}, please verify your email by visiting: {{VerificationUrl}}",
        "password-reset" => "Hi {{FirstName}}, reset your password by visiting: {{ResetUrl}}",
        _ => "{{Content}}"
    };
}
