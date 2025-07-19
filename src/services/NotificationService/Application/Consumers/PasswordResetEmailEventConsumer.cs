using Events.Security.Authentication;
using MassTransit;
using MediatR;
using NotificationService.Application.Commands;
using NotificationService.Domain.Entities;

namespace NotificationService.Application.Consumers;

// ============================================================================
// PASSWORD MANAGEMENT EVENT CONSUMERS
// ============================================================================

public class PasswordResetEmailEventConsumer(
    IMediator mediator,
    ILogger<PasswordResetEmailEventConsumer> logger,
    IConfiguration configuration)
    : IConsumer<PasswordResetEmailEvent>
{
    private readonly IMediator _mediator = mediator;
    private readonly ILogger<PasswordResetEmailEventConsumer> _logger = logger;
    private readonly IConfiguration _configuration = configuration;

    public async Task Consume(ConsumeContext<PasswordResetEmailEvent> context)
    {
        try
        {
            _logger.LogInformation("Processing PasswordResetEmailEvent for {Email}", context.Message.Email);

            var appUrl = _configuration["AppSettings:BaseUrl"] ?? "https://skillswap.com";
            var resetUrl = $"{appUrl}/reset-password?token={context.Message.ResetToken}&email={Uri.EscapeDataString(context.Message.Email)}";

            var variables = new Dictionary<string, string>
            {
                ["FirstName"] = context.Message.FirstName,
                ["ResetUrl"] = resetUrl,
                ["AppUrl"] = appUrl
            };

            var command = new SendNotificationCommand(
                NotificationTypes.Email,
                EmailTemplateNames.PasswordReset,
                context.Message.Email,
                variables,
                NotificationPriority.High,
                CorrelationId: context.ConversationId?.ToString())
            {
                UserId = context.Message.UserId
            };

            await _mediator.Send(command);

            _logger.LogInformation("Password reset email sent for {Email}", context.Message.Email);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing PasswordResetEmailEvent for {Email}", context.Message.Email);
            throw;
        }
    }
}
