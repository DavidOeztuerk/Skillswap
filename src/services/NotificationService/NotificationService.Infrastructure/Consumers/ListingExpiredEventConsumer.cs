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
/// Consumer for ListingExpiredIntegrationEvent
/// Phase 10: Listing concept with expiration
/// </summary>
public class ListingExpiredEventConsumer(
    IMediator mediator,
    ILogger<ListingExpiredEventConsumer> logger,
    IConfiguration configuration)
    : IConsumer<ListingExpiredIntegrationEvent>
{
    private readonly IMediator _mediator = mediator;
    private readonly ILogger<ListingExpiredEventConsumer> _logger = logger;
    private readonly IConfiguration _configuration = configuration;

    public async Task Consume(ConsumeContext<ListingExpiredIntegrationEvent> context)
    {
        try
        {
            _logger.LogInformation(
                "Processing ListingExpiredIntegrationEvent for listing {ListingId}, user {UserId}",
                context.Message.ListingId,
                context.Message.UserId);

            var appUrl = _configuration["AppSettings:BaseUrl"] ?? "https://skillswap.com";
            var createListingUrl = $"{appUrl}/my-skills?action=relist&skill={context.Message.SkillId}";

            var variables = new Dictionary<string, string>
            {
                ["FirstName"] = context.Message.UserFirstName,
                ["SkillName"] = context.Message.SkillName,
                ["ExpiredAt"] = context.Message.ExpiredAt.ToString("dd.MM.yyyy HH:mm"),
                ["CreateListingUrl"] = createListingUrl,
                ["AppUrl"] = appUrl
            };

            var command = new SendNotificationCommand(
                NotificationTypes.Email,
                EmailTemplateNames.ListingExpired,
                context.Message.UserEmail,
                variables,
                NotificationPriority.Low.ToString(),
                CorrelationId: context.ConversationId?.ToString())
            {
                UserId = context.Message.UserId
            };

            await _mediator.Send(command);

            _logger.LogInformation(
                "Listing expired notification sent for listing {ListingId}",
                context.Message.ListingId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "Error processing ListingExpiredIntegrationEvent for listing {ListingId}",
                context.Message.ListingId);
            throw;
        }
    }
}
