using Events.Notification;
using MassTransit;
using MediatR;
using NotificationService.Application.Commands;
using NotificationService.Domain.Entities;
using NotificationService.Domain.Enums;

namespace NotificationService.Application.Consumers;

public class AccountReactivatedNotificationEventConsumer : IConsumer<AccountReactivatedNotificationEvent>
{
    private readonly IMediator _mediator;
    private readonly ILogger<AccountReactivatedNotificationEventConsumer> _logger;

    public AccountReactivatedNotificationEventConsumer(
        IMediator mediator,
        ILogger<AccountReactivatedNotificationEventConsumer> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<AccountReactivatedNotificationEvent> context)
    {
        try
        {
            _logger.LogInformation("Processing AccountReactivatedNotificationEvent for {Email}", context.Message.Email);

            var variables = new Dictionary<string, string>
            {
                ["ReactivationTime"] = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss UTC")
            };

            var command = new SendNotificationCommand(
                NotificationTypes.Email,
                EmailTemplateNames.AccountReactivated,
                context.Message.Email,
                variables,
                NotificationPriority.Normal.ToString(),
                CorrelationId: context.ConversationId?.ToString())
            {
                UserId = context.Message.UserId
            };

            await _mediator.Send(command);

            _logger.LogInformation("Account reactivated notification sent for {Email}", context.Message.Email);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing AccountReactivatedNotificationEvent for {Email}", context.Message.Email);
            throw;
        }
    }
}
