using Events;
using MassTransit;
using MediatR;
using NotificationService.Application.Commands;
using NotificationService.Domain.Entities;

namespace NotificationService.Application.Consumers;

// ============================================================================
// SECURITY EVENT CONSUMERS
// ============================================================================

public class SecurityAlertEventConsumer : IConsumer<SecurityAlertEvent>
{
    private readonly IMediator _mediator;
    private readonly ILogger<SecurityAlertEventConsumer> _logger;

    public SecurityAlertEventConsumer(
        IMediator mediator,
        ILogger<SecurityAlertEventConsumer> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<SecurityAlertEvent> context)
    {
        try
        {
            _logger.LogInformation("Processing SecurityAlertEvent for {Email}", context.Message.Email);

            var variables = new Dictionary<string, string>
            {
                ["ActivityType"] = context.Message.ActivityType,
                ["IpAddress"] = context.Message.IpAddress,
                ["AlertTime"] = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss UTC")
            };

            // Send email notification
            var emailCommand = new SendNotificationCommand(
                context.Message.UserId,
                NotificationTypes.Email,
                EmailTemplateNames.SecurityAlert,
                context.Message.Email,
                variables,
                NotificationPriority.Urgent,
                CorrelationId: context.ConversationId?.ToString());

            await _mediator.Send(emailCommand);

            // Also send push notification if available
            var pushVariables = new Dictionary<string, string>
            {
                ["Title"] = "Security Alert",
                ["Body"] = $"Unusual activity detected: {context.Message.ActivityType}"
            };

            var pushCommand = new SendNotificationCommand(
                context.Message.UserId,
                NotificationTypes.Push,
                "security-alert",
                context.Message.UserId, // For push, recipient is user ID
                pushVariables,
                NotificationPriority.Urgent,
                CorrelationId: context.ConversationId?.ToString());

            await _mediator.Send(pushCommand);

            _logger.LogInformation("Security alert notifications sent for {Email}", context.Message.Email);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing SecurityAlertEvent for {Email}", context.Message.Email);
            throw;
        }
    }
}
