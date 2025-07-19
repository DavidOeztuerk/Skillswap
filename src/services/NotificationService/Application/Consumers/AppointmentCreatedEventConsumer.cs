using Events.Integration.AppointmentManagement;
using MassTransit;
using MediatR;
using NotificationService.Application.Commands;
using NotificationService.Domain.Entities;

namespace NotificationService.Application.Consumers;

// ============================================================================
// APPOINTMENT EVENT CONSUMERS (Future Integration)
// ============================================================================

public class AppointmentCreatedEventConsumer(
    IMediator mediator,
    ILogger<AppointmentCreatedEventConsumer> logger)
    : IConsumer<AppointmentCreatedEvent>
{
    private readonly IMediator _mediator = mediator;
    private readonly ILogger<AppointmentCreatedEventConsumer> _logger = logger;

    public async Task Consume(ConsumeContext<AppointmentCreatedEvent> context)
    {
        await Task.CompletedTask;
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
                NotificationTypes.Email,
                EmailTemplateNames.AppointmentConfirmation,
                "placeholder@email.com", // We'd need to get email from UserService
                variables,
                NotificationPriority.Normal,
                CorrelationId: context.ConversationId?.ToString())
            {
                UserId = context.Message.CreatedBy
            };

            // Send notification to participant
            var participantCommand = new SendNotificationCommand(
                NotificationTypes.Email,
                EmailTemplateNames.AppointmentConfirmation,
                "placeholder@email.com", // We'd need to get email from UserService
                variables,
                NotificationPriority.Normal,
                CorrelationId: context.ConversationId?.ToString())
            {
                UserId = context.Message.ParticipantId
            };

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
