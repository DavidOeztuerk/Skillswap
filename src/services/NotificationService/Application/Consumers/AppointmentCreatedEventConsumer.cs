using Events;
using MassTransit;
using MediatR;
using NotificationService.Application.Commands;
using NotificationService.Domain.Entities;

namespace NotificationService.Application.Consumers;

// ============================================================================
// APPOINTMENT EVENT CONSUMERS (Future Integration)
// ============================================================================

public class AppointmentCreatedEventConsumer : IConsumer<AppointmentCreatedEvent>
{
    private readonly IMediator _mediator;
    private readonly ILogger<AppointmentCreatedEventConsumer> _logger;

    public AppointmentCreatedEventConsumer(
        IMediator mediator,
        ILogger<AppointmentCreatedEventConsumer> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<AppointmentCreatedEvent> context)
    {
        try
        {
            _logger.LogInformation("Processing AppointmentCreatedEvent for appointment {AppointmentId}", context.Message.Id);

            var variables = new Dictionary<string, string>
            {
                ["AppointmentTitle"] = context.Message.Title,
                ["AppointmentDate"] = context.Message.Date.ToString("yyyy-MM-dd HH:mm:ss UTC"),
                ["AppointmentDescription"] = context.Message.Description
            };

            // Send confirmation to appointment creator
            var creatorCommand = new SendNotificationCommand(
                context.Message.CreatedBy,
                NotificationTypes.Email,
                EmailTemplateNames.AppointmentConfirmation,
                "placeholder@email.com", // We'd need to get email from UserService
                variables,
                NotificationPriority.Normal,
                CorrelationId: context.ConversationId?.ToString());

            // Send notification to participant
            var participantCommand = new SendNotificationCommand(
                context.Message.ParticipantId,
                NotificationTypes.Email,
                EmailTemplateNames.AppointmentConfirmation,
                "placeholder@email.com", // We'd need to get email from UserService
                variables,
                NotificationPriority.Normal,
                CorrelationId: context.ConversationId?.ToString());

            // For now, we'll skip sending as we don't have the email addresses
            // await _mediator.Send(creatorCommand);
            // await _mediator.Send(participantCommand);

            _logger.LogInformation("Appointment confirmation notifications processed for {AppointmentId}", context.Message.Id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing AppointmentCreatedEvent for appointment {AppointmentId}", context.Message.Id);
            throw;
        }
    }
}
