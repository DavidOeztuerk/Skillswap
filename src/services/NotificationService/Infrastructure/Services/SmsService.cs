using Microsoft.Extensions.Options;
using Twilio;
using Twilio.Rest.Api.V2010.Account;

namespace NotificationService.Infrastructure.Services;

public class SmsService : ISmsService
{
    private readonly ILogger<SmsService> _logger;
    private readonly SmsConfiguration _config;
    private readonly ITemplateEngine _templateEngine;

    public SmsService(
        ILogger<SmsService> logger,
        IOptions<SmsConfiguration> configuration,
        ITemplateEngine templateEngine)
    {
        _logger = logger;
        _templateEngine = templateEngine;
        _config = configuration.Value
                 ?? throw new InvalidOperationException("SMS configuration not found");

        if (!string.IsNullOrEmpty(_config.TwilioAccountSid) && !string.IsNullOrEmpty(_config.TwilioAuthToken))
        {
            TwilioClient.Init(_config.TwilioAccountSid, _config.TwilioAuthToken);
        }
    }

    public async Task<bool> SendSmsAsync(string to, string message)
    {
        try
        {
            if (string.IsNullOrEmpty(_config.TwilioAccountSid))
            {
                _logger.LogWarning("SMS not configured, skipping SMS to {PhoneNumber}", to);
                return false;
            }

            var messageOptions = new CreateMessageOptions(to)
            {
                From = _config.FromNumber,
                Body = message
            };

            var result = await MessageResource.CreateAsync(messageOptions);

            _logger.LogInformation("SMS sent successfully to {PhoneNumber}, SID: {MessageSid}", to, result.Sid);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send SMS to {PhoneNumber}", to);
            return false;
        }
    }

    public async Task<bool> SendTemplatedSmsAsync(string to, string templateName, Dictionary<string, string> variables)
    {
        try
        {
            var template = GetSmsTemplate(templateName);
            var message = _templateEngine.RenderTemplate(template, variables);

            return await SendSmsAsync(to, message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send templated SMS {TemplateName} to {PhoneNumber}", templateName, to);
            return false;
        }
    }

    private static string GetSmsTemplate(string templateName) => templateName switch
    {
        "security-alert" => "SkillSwap Security Alert: Unusual activity detected on your account. If this wasn't you, please contact support.",
        "appointment-reminder" => "Reminder: Your skill session with {{PartnerName}} is tomorrow at {{Time}}. Reply STOP to opt out.",
        "password-reset" => "Your SkillSwap password reset code: {{Code}}. Valid for 10 minutes.",
        _ => "{{Message}}"
    };
}
