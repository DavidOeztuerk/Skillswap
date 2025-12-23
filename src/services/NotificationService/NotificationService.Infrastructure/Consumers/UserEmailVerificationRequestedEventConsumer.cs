using Contracts.Events;
using Microsoft.Extensions.Logging;
using MassTransit;
using MediatR;
using NotificationService.Application.Commands;
using NotificationService.Domain.Entities;
using NotificationService.Domain.Enums;
using Microsoft.Extensions.Configuration;

namespace NotificationService.Application.Consumers;
public class UserEmailVerificationRequestedEventConsumer(
    IMediator mediator,
    ILogger<UserEmailVerificationRequestedEventConsumer> logger,
    IConfiguration configuration)
    : IConsumer<UserEmailVerificationRequestedEvent>
{
    private readonly IMediator _mediator = mediator;
    private readonly ILogger<UserEmailVerificationRequestedEventConsumer> _logger = logger;
    private readonly IConfiguration _configuration = configuration;
    public async Task Consume(ConsumeContext<UserEmailVerificationRequestedEvent> context)
    {
        try
        {
            _logger.LogInformation("Processing UserEmailVerificationRequestedEvent for {Email}", context.Message.Email);
            var appUrl = _configuration["AppSettings:BaseUrl"] ?? "https://skillswap.com";
            // Use verification code instead of token for URL
            var verificationUrl = $"{appUrl}/verify-email?code={context.Message.VerificationCode}&email={Uri.EscapeDataString(context.Message.Email)}";
            var variables = new Dictionary<string, string>
            {
                ["FirstName"] = context.Message.UserName,
                ["VerificationCode"] = context.Message.VerificationCode,
                ["VerificationUrl"] = verificationUrl,
                ["AppUrl"] = appUrl,
                ["ExpiresAt"] = context.Message.ExpiresAt.ToString("dd.MM.yyyy HH:mm")
            };
            var command = new SendNotificationCommand(
                NotificationTypes.Email,
                EmailTemplateNames.EmailVerification,
                context.Message.Email,
                variables,
                NotificationPriority.High.ToString(),
                CorrelationId: context.ConversationId?.ToString());
            command.UserId = context.Message.UserId.ToString();
            await _mediator.Send(command);
            _logger.LogInformation("Email verification notification sent for {Email}", context.Message.Email);
        }
        catch (Exception ex) 
        {
            _logger.LogError(ex, "Error processing UserEmailVerificationRequestedEvent for {Email}", context.Message.Email);
            throw;
        }
    }
}
