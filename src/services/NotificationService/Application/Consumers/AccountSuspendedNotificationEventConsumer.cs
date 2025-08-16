using Events.Notification;
using MassTransit;
using MediatR;
using NotificationService.Application.Commands;
using NotificationService.Domain.Entities;
using NotificationService.Domain.Enums;

namespace NotificationService.Application.Consumers;

// ============================================================================
// ACCOUNT STATUS EVENT CONSUMERS
// ============================================================================

public class AccountSuspendedNotificationEventConsumer : IConsumer<AccountSuspendedNotificationEvent>
{
    private readonly IMediator _mediator;
    private readonly ILogger<AccountSuspendedNotificationEventConsumer> _logger;

    public AccountSuspendedNotificationEventConsumer(
        IMediator mediator,
        ILogger<AccountSuspendedNotificationEventConsumer> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<AccountSuspendedNotificationEvent> context)
    {
        try
        {
            _logger.LogInformation("Processing AccountSuspendedNotificationEvent for {Email}", context.Message.Email);

            var variables = new Dictionary<string, string>
            {
                ["Reason"] = context.Message.Reason,
                ["SuspensionTime"] = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss UTC")
            };

            var command = new SendNotificationCommand(
                NotificationTypes.Email,
                EmailTemplateNames.AccountSuspended,
                context.Message.Email,
                variables,
                NotificationPriority.High.ToString(),
                CorrelationId: context.ConversationId?.ToString())
            {
                UserId = context.Message.UserId
            };

            await _mediator.Send(command);

            _logger.LogInformation("Account suspended notification sent for {Email}", context.Message.Email);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing AccountSuspendedNotificationEvent for {Email}", context.Message.Email);
            throw;
        }
    }
}
