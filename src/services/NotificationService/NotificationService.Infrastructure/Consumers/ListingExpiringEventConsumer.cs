using Events.Integration.SkillManagement;
using Microsoft.Extensions.Logging;
using MassTransit;
using MediatR;
using Microsoft.Extensions.Configuration;
using NotificationService.Application.Commands;
using NotificationService.Domain.Entities;
using NotificationService.Domain.Enums;

namespace NotificationService.Infrastructure.Consumers;

/// <summary>
/// Consumer for ListingExpiringIntegrationEvent
/// </summary>
public class ListingExpiringEventConsumer(
    IMediator mediator,
    ILogger<ListingExpiringEventConsumer> logger,
    IConfiguration configuration)
    : IConsumer<ListingExpiringIntegrationEvent>
{
    private readonly IMediator _mediator = mediator;
    private readonly ILogger<ListingExpiringEventConsumer> _logger = logger;
    private readonly IConfiguration _configuration = configuration;

    public async Task Consume(ConsumeContext<ListingExpiringIntegrationEvent> context)
    {
        try
        {
            _logger.LogInformation(
                "Processing ListingExpiringIntegrationEvent for listing {ListingId}, user {UserId}",
                context.Message.ListingId,
                context.Message.UserId);

            var appUrl = _configuration["AppSettings:BaseUrl"] ?? "https://skillswap.com";
            var refreshUrl = $"{appUrl}/my-skills?listing={context.Message.ListingId}";

            var variables = new Dictionary<string, string>
            {
                ["FirstName"] = context.Message.UserFirstName,
                ["SkillName"] = context.Message.SkillName,
                ["DaysRemaining"] = context.Message.DaysRemaining.ToString(),
                ["ExpiresAt"] = context.Message.ExpiresAt.ToString("dd.MM.yyyy HH:mm"),
                ["RefreshUrl"] = refreshUrl,
                ["AppUrl"] = appUrl
            };

            var command = new SendNotificationCommand(
                NotificationTypes.Email,
                EmailTemplateNames.ListingExpiring,
                context.Message.UserEmail,
                variables,
                NotificationPriority.Normal.ToString(),
                CorrelationId: context.ConversationId?.ToString())
            {
                UserId = context.Message.UserId
            };

            await _mediator.Send(command);

            _logger.LogInformation(
                "Listing expiring notification sent for listing {ListingId}, {Days} days remaining",
                context.Message.ListingId,
                context.Message.DaysRemaining);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "Error processing ListingExpiringIntegrationEvent for listing {ListingId}",
                context.Message.ListingId);
            throw;
        }
    }
}
