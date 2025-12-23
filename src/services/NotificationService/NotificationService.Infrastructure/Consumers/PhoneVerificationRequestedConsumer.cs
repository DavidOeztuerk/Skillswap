using Contracts.Events;
using MassTransit;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace NotificationService.Consumers;

public class PhoneVerificationRequestedConsumer : IConsumer<PhoneVerificationRequestedEvent>
{
    private readonly ILogger<PhoneVerificationRequestedConsumer> _logger;
    private readonly IConfiguration _configuration;

    public PhoneVerificationRequestedConsumer(
        ILogger<PhoneVerificationRequestedConsumer> logger,
        IConfiguration configuration)
    {
        _logger = logger;
        _configuration = configuration;
    }

    public async Task Consume(ConsumeContext<PhoneVerificationRequestedEvent> context)
    {
        try
        {
            var message = context.Message;

            _logger.LogInformation(
                "Processing phone verification request for user {UserId} to {PhoneNumber}",
                message.UserId, message.PhoneNumber);

            // In a production environment, this would integrate with an SMS provider like:
            // - Twilio
            // - AWS SNS
            // - Azure Communication Services
            // - Vonage (Nexmo)

            // For development, we just log the verification code
            _logger.LogInformation(
                "DEVELOPMENT MODE: Verification code {Code} would be sent to {PhoneNumber}. Expires at {ExpiresAt}",
                message.VerificationCode, message.PhoneNumber, message.ExpiresAt);

            // Example Twilio integration (commented out for development):
            /*
            var twilioAccountSid = _configuration["Twilio:AccountSid"];
            var twilioAuthToken = _configuration["Twilio:AuthToken"];
            var twilioFromNumber = _configuration["Twilio:FromNumber"];
            
            if (!string.IsNullOrEmpty(twilioAccountSid) && !string.IsNullOrEmpty(twilioAuthToken))
            {
                TwilioClient.Init(twilioAccountSid, twilioAuthToken);
                
                var smsMessage = await MessageResource.CreateAsync(
                    body: $"Your SkillSwap verification code is: {message.VerificationCode}. This code expires in 10 minutes.",
                    from: new PhoneNumber(twilioFromNumber),
                    to: new PhoneNumber(message.PhoneNumber)
                );
                
                _logger.LogInformation(
                    "SMS sent successfully. MessageSid: {MessageSid}",
                    smsMessage.Sid);
            }
            */

            await Task.CompletedTask;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "Error processing phone verification request for user {UserId}",
                context.Message.UserId);
            throw;
        }
    }
}