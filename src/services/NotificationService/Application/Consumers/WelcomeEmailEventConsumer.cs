using Events;
using MassTransit;
using MediatR;
using NotificationService.Application.Commands;
using NotificationService.Domain.Entities;

namespace NotificationService.Application.Consumers;

public class WelcomeEmailEventConsumer : IConsumer<WelcomeEmailEvent>
{
    private readonly IMediator _mediator;
    private readonly ILogger<WelcomeEmailEventConsumer> _logger;
    private readonly IConfiguration _configuration;

    public WelcomeEmailEventConsumer(
        IMediator mediator,
        ILogger<WelcomeEmailEventConsumer> logger,
        IConfiguration configuration)
    {
        _mediator = mediator;
        _logger = logger;
        _configuration = configuration;
    }

    public async Task Consume(ConsumeContext<WelcomeEmailEvent> context)
    {
        try
        {
            _logger.LogInformation("Processing WelcomeEmailEvent for {Email}", context.Message.Email);

            var appUrl = _configuration["AppSettings:BaseUrl"] ?? "https://skillswap.com";

            var variables = new Dictionary<string, string>
            {
                ["FirstName"] = "User", // We might need to get this from UserService
                ["AppUrl"] = appUrl
            };

            var command = new SendNotificationCommand(
                context.Message.UserId,
                NotificationTypes.Email,
                EmailTemplateNames.Welcome,
                context.Message.Email,
                variables,
                NotificationPriority.Normal,
                CorrelationId: context.ConversationId?.ToString());

            await _mediator.Send(command);

            _logger.LogInformation("Welcome email sent for {Email}", context.Message.Email);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing WelcomeEmailEvent for {Email}", context.Message.Email);
            throw;
        }
    }
}
