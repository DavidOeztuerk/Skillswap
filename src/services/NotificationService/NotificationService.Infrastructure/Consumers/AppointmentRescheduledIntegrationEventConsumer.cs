using Events.Integration.AppointmentManagement;
using Microsoft.Extensions.Logging;
using MassTransit;
using NotificationService.Domain.Services;

namespace NotificationService.Infrastructure.Consumers;

/// <summary>
/// Consumes appointment rescheduled events and sends notification emails
/// </summary>
public class AppointmentRescheduledIntegrationEventConsumer(
    ILogger<AppointmentRescheduledIntegrationEventConsumer> logger,
    INotificationOrchestrator orchestrator)
    : IConsumer<AppointmentRescheduledIntegrationEvent>
{
    private readonly ILogger<AppointmentRescheduledIntegrationEventConsumer> _logger = logger;
    private readonly INotificationOrchestrator _orchestrator = orchestrator;

    public async Task Consume(ConsumeContext<AppointmentRescheduledIntegrationEvent> context)
    {
        var message = context.Message;

        _logger.LogInformation(
            "Processing appointment rescheduled event for appointment {AppointmentId}",
            message.AppointmentId);

        try
        {
            // Prepare email variables
            var commonVariables = new Dictionary<string, string>
            {
                { "AppointmentId", message.AppointmentId },
                { "OldScheduledDate", message.OldScheduledDate.ToString("dddd, MMMM dd, yyyy") },
                { "OldScheduledTime", message.OldScheduledDate.ToString("hh:mm tt") },
                { "NewScheduledDate", message.NewScheduledDate.ToString("dddd, MMMM dd, yyyy") },
                { "NewScheduledTime", message.NewScheduledDate.ToString("hh:mm tt") },
                { "OldDurationMinutes", message.OldDurationMinutes.ToString() },
                { "NewDurationMinutes", message.NewDurationMinutes.ToString() },
                { "Reason", message.Reason ?? "No reason provided" },
                { "MeetingLink", message.MeetingLink ?? "#" },
                { "SkillName", message.SkillName ?? "Skill Session" },
                { "SkillCategory", message.SkillCategory ?? "General" },
                { "RescheduledByName", $"{message.RescheduledByFirstName} {message.RescheduledByLastName}" }
            };

            // Send notification to the other participant
            var recipientVariables = new Dictionary<string, string>(commonVariables)
            {
                { "RecipientName", $"{message.OtherParticipantFirstName} {message.OtherParticipantLastName}" },
                { "RecipientFirstName", message.OtherParticipantFirstName }
            };

            await SendNotificationAsync(
                message.OtherParticipantUserId,
                message.OtherParticipantEmail,
                message.OtherParticipantPhoneNumber,
                "appointment-rescheduled",
                recipientVariables);

            // Also send confirmation to the person who rescheduled
            var initiatorVariables = new Dictionary<string, string>(commonVariables)
            {
                { "RecipientName", $"{message.RescheduledByFirstName} {message.RescheduledByLastName}" },
                { "RecipientFirstName", message.RescheduledByFirstName }
            };

            await SendNotificationAsync(
                message.RescheduledByUserId,
                message.RescheduledByEmail,
                null, // We don't have phone for the initiator in this event
                "appointment-rescheduled-confirmation",
                initiatorVariables);

            _logger.LogInformation(
                "Successfully sent appointment rescheduled notifications for appointment {AppointmentId}",
                message.AppointmentId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "Failed to process appointment rescheduled event for appointment {AppointmentId}",
                message.AppointmentId);
            throw; // Let MassTransit handle retry
        }
    }

    private async Task SendNotificationAsync(
        string userId,
        string email,
        string? phoneNumber,
        string templateName,
        Dictionary<string, string> variables)
    {
        // Send email notification immediately (reschedule notifications are time-sensitive)
        var emailSent = await _orchestrator.SendImmediateNotificationAsync(
            userId: userId,
            type: "Email",
            template: templateName,
            recipient: email,
            variables: variables,
            priority: "High");

        if (emailSent)
        {
            _logger.LogInformation("Email sent successfully to {Email} for template {Template}",
                email, templateName);
        }
        else
        {
            _logger.LogWarning("Failed to send email to {Email} for template {Template}",
                email, templateName);
        }

        // Send SMS if phone number is available
        if (!string.IsNullOrEmpty(phoneNumber))
        {
            var smsMessage = $"Your SkillSwap session has been rescheduled " +
                $"from {variables["OldScheduledDate"]} at {variables["OldScheduledTime"]} " +
                $"to {variables["NewScheduledDate"]} at {variables["NewScheduledTime"]}. " +
                $"Reason: {variables["Reason"]}";
            var smsVariables = new Dictionary<string, string> { { "Message", smsMessage } };

            var smsSent = await _orchestrator.SendImmediateNotificationAsync(
                userId: userId,
                type: "SMS",
                template: "sms-notification",
                recipient: phoneNumber,
                variables: smsVariables,
                priority: "High");

            if (smsSent)
            {
                _logger.LogInformation("SMS sent successfully to {PhoneNumber}", phoneNumber);
            }
        }
    }
}
