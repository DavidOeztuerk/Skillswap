using Events.Security.ThreatDetection;
using Microsoft.Extensions.Logging;
using MassTransit;
using MediatR;
using NotificationService.Application.Commands;
using NotificationService.Domain.Entities;
using NotificationService.Domain.Enums;

namespace NotificationService.Application.Consumers;

public class SuspiciousActivityDetectedEventConsumer(
    IMediator mediator,
    ILogger<SuspiciousActivityDetectedEventConsumer> logger) 
    : IConsumer<SuspiciousActivityDetectedEvent>
{
    private readonly IMediator _mediator = mediator;
    private readonly ILogger<SuspiciousActivityDetectedEventConsumer> _logger = logger;

    public async Task Consume(ConsumeContext<SuspiciousActivityDetectedEvent> context)
    {
        try
        {
            _logger.LogInformation("Processing SuspiciousActivityDetectedEvent for {Email} with {FailedAttemptCount} failed attempts",
                context.Message.Email, context.Message.FailedAttemptCount);
            // Only send notification if there are multiple failed attempts
            if (context.Message.FailedAttemptCount >= 3)
            {
                var variables = new Dictionary<string, string>
                {
                    ["ActivityType"] = context.Message.ActivityType,
                    ["IpAddress"] = context.Message.IpAddress,
                    ["FailedAttemptCount"] = context.Message.FailedAttemptCount.ToString(),
                    ["AlertTime"] = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss UTC")
                };
                var command = new SendNotificationCommand(
                    NotificationTypes.Email,
                    EmailTemplateNames.SecurityAlert,
                    context.Message.Email,
                    variables,
                    NotificationPriority.High.ToString(),
                    CorrelationId: context.ConversationId?.ToString())
                {
                    UserId = context.Message.UserId
                };

                await _mediator.Send(command);
                _logger.LogInformation("Suspicious activity notification sent for {Email}", context.Message.Email);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing SuspiciousActivityDetectedEvent for {Email}", context.Message.Email);
            throw;
        }
    }
}
