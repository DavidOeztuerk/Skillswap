using Events.Security.Authentication;
using MassTransit;
using MediatR;
using NotificationService.Application.Commands;
using NotificationService.Domain.Entities;
using NotificationService.Domain.Enums;

namespace NotificationService.Application.Consumers;

public class PasswordChangedNotificationEventConsumer(
    IMediator mediator,
    ILogger<PasswordChangedNotificationEventConsumer> logger)
    : IConsumer<PasswordChangedNotificationEvent>
{
    private readonly IMediator _mediator = mediator;
    private readonly ILogger<PasswordChangedNotificationEventConsumer> _logger = logger;

    public async Task Consume(ConsumeContext<PasswordChangedNotificationEvent> context)
    {
        try
        {
            _logger.LogInformation("Processing PasswordChangedNotificationEvent for {Email}", context.Message.Email);

            var variables = new Dictionary<string, string>
            {
                ["ChangeTime"] = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss UTC")
            };

            var command = new SendNotificationCommand(
                NotificationTypes.Email,
                EmailTemplateNames.PasswordChanged,
                context.Message.Email,
                variables,
                NotificationPriority.Normal.ToString(),
                CorrelationId: context.ConversationId?.ToString())
            {
                UserId = context.Message.UserId
            };

            await _mediator.Send(command);

            _logger.LogInformation("Password changed notification sent for {Email}", context.Message.Email);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing PasswordChangedNotificationEvent for {Email}", context.Message.Email);
            throw;
        }
    }
}
