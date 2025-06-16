using Events;
using MassTransit;
using MediatR;
using NotificationService.Application.Commands;
using NotificationService.Domain.Entities;

namespace NotificationService.Application.Consumers;

public class EmailVerificationRequestedEventConsumer(
    IMediator mediator,
    ILogger<EmailVerificationRequestedEventConsumer> logger,
    IConfiguration configuration)
    : IConsumer<EmailVerificationRequestedEvent>
{
    private readonly IMediator _mediator = mediator;
    private readonly ILogger<EmailVerificationRequestedEventConsumer> _logger = logger;
    private readonly IConfiguration _configuration = configuration;

    public async Task Consume(ConsumeContext<EmailVerificationRequestedEvent> context)
    {
        try
        {
            _logger.LogInformation("Processing EmailVerificationRequestedEvent for {Email}", context.Message.Email);

            var appUrl = _configuration["AppSettings:BaseUrl"] ?? "https://skillswap.com";
            var verificationUrl = $"{appUrl}/verify-email?token={context.Message.VerificationToken}&email={Uri.EscapeDataString(context.Message.Email)}";

            var variables = new Dictionary<string, string>
            {
                ["FirstName"] = context.Message.FirstName,
                ["VerificationUrl"] = verificationUrl,
                ["AppUrl"] = appUrl
            };

            var command = new SendNotificationCommand(
                NotificationTypes.Email,
                EmailTemplateNames.EmailVerification,
                context.Message.Email,
                variables,
                NotificationPriority.High,
                CorrelationId: context.ConversationId?.ToString());
                
            command.UserId = context.Message.UserId;

            await _mediator.Send(command);

            _logger.LogInformation("Email verification notification sent for {Email}", context.Message.Email);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing EmailVerificationRequestedEvent for {Email}", context.Message.Email);
            throw;
        }
    }
}
