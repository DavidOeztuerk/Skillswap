using Events;
using MassTransit;

namespace NotificationService.Application.Consumers;

// ============================================================================
// GENERIC EVENT CONSUMER FOR DEBUGGING
// ============================================================================

public class GenericEventLoggingConsumer :
    IConsumer<UserRegisteredEvent>,
    IConsumer<SkillCreatedEvent>,
    IConsumer<MatchFoundEvent>,
    IConsumer<AppointmentCreatedEvent>
{
    private readonly ILogger<GenericEventLoggingConsumer> _logger;

    public GenericEventLoggingConsumer(ILogger<GenericEventLoggingConsumer> logger)
    {
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<UserRegisteredEvent> context)
    {
        _logger.LogInformation("Received UserRegisteredEvent: {Email} at {Timestamp}",
            context.Message.Email, context.SentTime);
        await Task.CompletedTask;
    }

    public async Task Consume(ConsumeContext<SkillCreatedEvent> context)
    {
        _logger.LogInformation("Received SkillCreatedEvent: {SkillName} by {CreatorId} at {Timestamp}",
            context.Message.Name, context.Message.SkillCreatorId, context.SentTime);
        await Task.CompletedTask;
    }

    public async Task Consume(ConsumeContext<MatchFoundEvent> context)
    {
        _logger.LogInformation("Received MatchFoundEvent: {SkillName} between {SearcherId} and {CreatorId} at {Timestamp}",
            context.Message.SkillName, context.Message.SkillSearcherId, context.Message.SkillCreatorId, context.SentTime);
        await Task.CompletedTask;
    }

    public async Task Consume(ConsumeContext<AppointmentCreatedEvent> context)
    {
        _logger.LogInformation("Received AppointmentCreatedEvent: {Title} on {Date} at {Timestamp}",
            context.Message.Title, context.Message.Date, context.SentTime);
        await Task.CompletedTask;
    }
}