using Events.Integration.AppointmentManagement;
using Microsoft.Extensions.Logging;
using Events.Integration.Communication;
using Events.Integration.SkillManagement;
using MassTransit;
using Events.Integration.UserManagement;

namespace NotificationService.Infrastructure.Consumers;

public class GenericEventLoggingConsumer(
    ILogger<GenericEventLoggingConsumer> logger) :
    IConsumer<UserRegisteredEvent>,
    IConsumer<SkillCreatedEvent>,
    IConsumer<MatchFoundEvent>,
    IConsumer<AppointmentCreatedEvent>
{
    private readonly ILogger<GenericEventLoggingConsumer> _logger = logger;

    public async Task Consume(ConsumeContext<UserRegisteredEvent> context)
    {
        await Task.CompletedTask;
        _logger.LogInformation("Received UserRegisteredEvent: {Email} at {Timestamp}",
            context.Message.Email, context.SentTime);
    }

    public async Task Consume(ConsumeContext<SkillCreatedEvent> context)
    {
        await Task.CompletedTask;
        _logger.LogInformation("Received SkillCreatedEvent: {SkillName} by {CreatorId} at {Timestamp}",
            context.Message.Name, context.Message.SkillCreatorId, context.SentTime);
    }

    public async Task Consume(ConsumeContext<MatchFoundEvent> context)
    {
        await Task.CompletedTask;
        _logger.LogInformation("Received MatchFoundEvent: {SkillName} between {SearcherId} and {CreatorId} at {Timestamp}",
            context.Message.SkillName, context.Message.SkillSearcherId, context.Message.SkillCreatorId, context.SentTime);
    }

    public async Task Consume(ConsumeContext<AppointmentCreatedEvent> context)
    {
        await Task.CompletedTask;
        _logger.LogInformation("Received AppointmentCreatedEvent: {Title} on {Date} at {Timestamp}",
            context.Message.Title, context.Message.Date, context.SentTime);
    }
}
