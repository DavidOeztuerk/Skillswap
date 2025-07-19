using Events.Integration.Communication;
using MassTransit;
using MediatR;
using NotificationService.Application.Commands;
using NotificationService.Domain.Entities;

namespace NotificationService.Application.Consumers;

// ============================================================================
// SKILL MATCHING EVENT CONSUMERS (Future Integration)
// ============================================================================

public class SkillMatchFoundEventConsumer(
    IMediator mediator,
    ILogger<SkillMatchFoundEventConsumer> logger)
    : IConsumer<MatchFoundEvent>
{
    private readonly IMediator _mediator = mediator;
    private readonly ILogger<SkillMatchFoundEventConsumer> _logger = logger;

    public async Task Consume(ConsumeContext<MatchFoundEvent> context)
    {
        await Task.CompletedTask;
        try
        {
            _logger.LogInformation("Processing SkillMatchFoundEvent for skill {SkillName}", context.Message.SkillName);

            // Send notification to skill searcher
            var searcherVariables = new Dictionary<string, string>
            {
                ["SkillName"] = context.Message.SkillName,
                ["MatchFoundTime"] = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss UTC")
            };

            var searcherCommand = new SendNotificationCommand(
                NotificationTypes.Email,
                EmailTemplateNames.SkillMatchFound,
                "placeholder@email.com", // We'd need to get email from UserService
                searcherVariables,
                NotificationPriority.Normal,
                CorrelationId: context.ConversationId?.ToString())
            {
                UserId = context.Message.SkillSearcherId
            };

            // For now, we'll skip sending as we don't have the email address
            // await _mediator.Send(searcherCommand);

            // Send notification to skill creator
            var creatorVariables = new Dictionary<string, string>
            {
                ["SkillName"] = context.Message.SkillName,
                ["MatchFoundTime"] = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss UTC")
            };

            var creatorCommand = new SendNotificationCommand(
                NotificationTypes.Email,
                EmailTemplateNames.SkillMatchFound,
                "placeholder@email.com", // We'd need to get email from UserService
                creatorVariables,
                NotificationPriority.Normal,
                CorrelationId: context.ConversationId?.ToString())
            {
                UserId = context.Message.SkillCreatorId
            };

            // For now, we'll skip sending as we don't have the email address
            // await _mediator.Send(creatorCommand);

            _logger.LogInformation("Skill match notifications processed for skill {SkillName}", context.Message.SkillName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing SkillMatchFoundEvent for skill {SkillName}", context.Message.SkillName);
            throw;
        }
    }
}
