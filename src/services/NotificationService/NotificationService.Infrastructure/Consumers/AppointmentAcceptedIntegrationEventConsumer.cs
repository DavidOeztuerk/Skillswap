using Events.Integration.AppointmentManagement;
using Microsoft.Extensions.Logging;
using MassTransit;
using NotificationService.Domain.Enums;
using NotificationService.Domain.Models;
using NotificationService.Domain.Services;

namespace NotificationService.Infrastructure.Consumers;

/// <summary>
/// Consumes appointment accepted events and sends confirmation emails with meeting links
/// </summary>
public class AppointmentAcceptedIntegrationEventConsumer(
    ILogger<AppointmentAcceptedIntegrationEventConsumer> logger,
    INotificationOrchestrator orchestrator,
    ISmartNotificationRouter router)
    : IConsumer<AppointmentAcceptedIntegrationEvent>
{
    private readonly ILogger<AppointmentAcceptedIntegrationEventConsumer> _logger = logger;
    private readonly INotificationOrchestrator _orchestrator = orchestrator;
    private readonly ISmartNotificationRouter _router = router;

    public async Task Consume(ConsumeContext<AppointmentAcceptedIntegrationEvent> context)
    {
        var message = context.Message;
        _logger.LogInformation(
            "Processing appointment accepted event for appointment {AppointmentId} with meeting link {MeetingLink}",
            message.AppointmentId, message.MeetingLink);

        try
        {
            // Only send notifications if both parties have accepted
            if (!message.BothPartiesAccepted)
            {
                _logger.LogInformation(
                    "Appointment {AppointmentId} not yet accepted by both parties, skipping notifications",
                    message.AppointmentId);
                return;
            }

            // Prepare email variables
            var commonVariables = new Dictionary<string, string>
            {
                { "AppointmentId", message.AppointmentId },
                { "ScheduledDate", message.ScheduledDate.ToString("dddd, MMMM dd, yyyy") },
                { "ScheduledTime", message.ScheduledDate.ToString("hh:mm tt") },
                { "DurationMinutes", message.DurationMinutes.ToString() },
                { "MeetingLink", message.MeetingLink ?? "#" },
                { "SkillName", message.SkillName ?? "Skill Session" },
                { "SkillCategory", message.SkillCategory ?? "General" }
            };

            // Send email to organizer
            var organizerVariables = new Dictionary<string, string>(commonVariables)
            {
                { "RecipientName", $"{message.OrganizerFirstName} {message.OrganizerLastName}" },
                { "RecipientFirstName", message.OrganizerFirstName },
                { "PartnerName", $"{message.ParticipantFirstName} {message.ParticipantLastName}" },
                { "PartnerFirstName", message.ParticipantFirstName }
            };

            await SendNotificationAsync(
                message.OrganizerUserId,
                message.OrganizerEmail,
                message.OrganizerPhoneNumber,
                "appointment-confirmation",
                organizerVariables);

            // Send email to participant
            var participantVariables = new Dictionary<string, string>(commonVariables)
            {
                { "RecipientName", $"{message.ParticipantFirstName} {message.ParticipantLastName}" },
                { "RecipientFirstName", message.ParticipantFirstName },
                { "PartnerName", $"{message.OrganizerFirstName} {message.OrganizerLastName}" },
                { "PartnerFirstName", message.OrganizerFirstName }
            };

            await SendNotificationAsync(
                message.ParticipantUserId,
                message.ParticipantEmail,
                message.ParticipantPhoneNumber,
                "appointment-confirmation",
                participantVariables);

            _logger.LogInformation(
                "Successfully sent appointment confirmation notifications for appointment {AppointmentId}",
                message.AppointmentId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "Failed to process appointment accepted event for appointment {AppointmentId}",
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
        // Use SmartNotificationRouter to determine optimal channels and timing
        var routingRequest = new NotificationRoutingRequest
        {
            UserId = userId,
            NotificationType = "appointment",
            Template = templateName,
            Priority = NotificationPriority.High, // Appointment confirmations are high priority
            Variables = variables,
            AllowDigest = false, // Don't batch appointment confirmations
            RespectQuietHours = false // Important to deliver immediately
        };

        var routingDecision = await _router.RouteNotificationAsync(routingRequest);

        _logger.LogInformation(
            "Routing decision for user {UserId}: Send immediately: {SendImmediately}, Channels: {Channels}, Reason: {Reason}",
            userId, routingDecision.SendImmediately,
            string.Join(", ", routingDecision.PrimaryChannels),
            routingDecision.DecisionReason);

        // Handle based on routing decision
        if (routingDecision.SendImmediately)
        {
            // Send to primary channels
            foreach (var channel in routingDecision.PrimaryChannels)
            {
                await SendToChannelAsync(userId, channel, email, phoneNumber, templateName, variables);
            }
        }
        else if (routingDecision.ScheduledFor.HasValue)
        {
            // Schedule for later delivery
            _logger.LogInformation(
                "Scheduling notification for user {UserId} at {ScheduledTime}",
                userId, routingDecision.ScheduledFor.Value);

            // Use orchestrator to schedule
            await _orchestrator.ScheduleNotificationAsync(
                userId: userId,
                type: "Multi",
                template: templateName,
                recipient: email,
                variables: variables,
                scheduledFor: routingDecision.ScheduledFor.Value,
                priority: routingDecision.EffectivePriority.ToString());
        }
        else if (routingDecision.AddToDigest)
        {
            // Add to digest
            _logger.LogInformation(
                "Adding notification to digest for user {UserId}",
                userId);

            // Store for digest processing
            await _orchestrator.AddToDigestAsync(
                userId,
                templateName,
                variables);
        }
        else
        {
            _logger.LogWarning(
                "Failed to send notification to user {UserId}",
                userId);
            // Don't throw - allow other notifications to be sent
        }
    }

    private async Task SendToChannelAsync(
        string userId,
        NotificationChannel channel,
        string email,
        string? phoneNumber,
        string templateName,
        Dictionary<string, string> variables)
    {
        switch (channel)
        {
            case NotificationChannel.Email:
                var emailSent = await _orchestrator.SendImmediateNotificationAsync(
                    userId: userId,
                    type: "Email",
                    template: templateName,
                    recipient: email,
                    variables: variables,
                    priority: "High");

                if (emailSent)
                {
                    _logger.LogInformation("Email sent successfully to {Email}", email);
                }
                else
                {
                    _logger.LogWarning("Failed to send email to {Email}", email);
                }
                break;

            case NotificationChannel.SMS:
                if (!string.IsNullOrEmpty(phoneNumber))
                {
                    var smsMessage = $"Your SkillSwap session for {variables["SkillName"]} " +
                        $"is confirmed for {variables["ScheduledDate"]} at {variables["ScheduledTime"]}. " +
                        $"Meeting link: {variables["MeetingLink"]}";
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
                break;

            case NotificationChannel.Push:
                // Push notification handling would go here
                _logger.LogInformation("Push notifications not yet implemented");
                break;

            case NotificationChannel.InApp:
                // In-app notification is handled via database storage
                await _orchestrator.SendImmediateNotificationAsync(
                    userId: userId,
                    type: "InApp",
                    template: templateName,
                    recipient: userId,
                    variables: variables,
                    priority: "High");
                break;
        }
    }
}
