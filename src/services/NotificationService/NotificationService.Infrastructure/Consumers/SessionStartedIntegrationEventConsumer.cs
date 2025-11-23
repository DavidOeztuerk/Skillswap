using Events.Integration.Appointment;
using Microsoft.Extensions.Logging;
using MassTransit;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Configuration;
using NotificationService.Domain.Services;
using NotificationService.Hubs;

namespace NotificationService.Infrastructure.Consumers;

/// <summary>
/// Consumes SessionStartedIntegrationEvent to send real-time notifications
/// when a session begins (5 minutes before scheduled time or when explicitly started)
/// </summary>
public class SessionStartedIntegrationEventConsumer : IConsumer<SessionStartedIntegrationEvent>
{
    private readonly IServiceScopeFactory _serviceScopeFactory;
    private readonly IConfiguration _configuration;
    private readonly IHubContext<NotificationHub> _notificationHub;
    private readonly ILogger<SessionStartedIntegrationEventConsumer> _logger;

    public SessionStartedIntegrationEventConsumer(
        IServiceScopeFactory serviceScopeFactory,
        IConfiguration configuration,
        IHubContext<NotificationHub> notificationHub,
        ILogger<SessionStartedIntegrationEventConsumer> logger)
    {
        _serviceScopeFactory = serviceScopeFactory;
        _configuration = configuration;
        _notificationHub = notificationHub;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<SessionStartedIntegrationEvent> context)
    {
        var message = context.Message;
        _logger.LogInformation(
            "Processing SessionStartedIntegrationEvent for session {SessionId}",
            message.SessionAppointmentId);

        try
        {
            // Send real-time notifications to both participants
            await Task.WhenAll(
                SendSessionStartedNotificationAsync(message, message.OrganizerUserId, context.CancellationToken),
                SendSessionStartedNotificationAsync(message, message.ParticipantUserId, context.CancellationToken)
            );

            // Send email notification (optional - for record keeping)
            await SendSessionStartedEmailAsync(message, context.CancellationToken);

            _logger.LogInformation(
                "Successfully processed SessionStartedIntegrationEvent for session {SessionId}",
                message.SessionAppointmentId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "Failed to process SessionStartedIntegrationEvent for session {SessionId}",
                message.SessionAppointmentId);
            throw;
        }
    }

    private async Task SendSessionStartedNotificationAsync(
        SessionStartedIntegrationEvent message,
        string userId,
        CancellationToken cancellationToken)
    {
        try
        {
            var partnerName = userId == message.OrganizerUserId
                ? (message.ParticipantName ?? "Participant")
                : (message.OrganizerName ?? "Organizer");

            var notification = new
            {
                type = "SessionStarted",
                sessionId = message.SessionAppointmentId,
                partnerName = partnerName,
                scheduledDate = message.ScheduledDate,
                meetingLink = message.MeetingLink,
                message = $"Your session with {partnerName} has started. Meeting link is active now.",
                timestamp = DateTime.UtcNow
            };

            await _notificationHub.Clients
                .User(userId)
                .SendAsync("ReceiveSessionNotification", notification, cancellationToken);

            _logger.LogInformation(
                "Sent SessionStarted notification to user {UserId} for session {SessionId}",
                userId, message.SessionAppointmentId);
        }
        catch (Exception ex)
        {
            // SignalR failure should not break the process
            _logger.LogWarning(ex,
                "Failed to send SessionStarted SignalR notification to user {UserId}. User may not be connected.",
                userId);
        }
    }

    private async Task SendSessionStartedEmailAsync(
        SessionStartedIntegrationEvent message,
        CancellationToken cancellationToken)
    {
        // Skip email if organizer email is not available
        if (string.IsNullOrEmpty(message.OrganizerEmail))
        {
            _logger.LogWarning(
                "Cannot send SessionStarted email to organizer - email is missing for session {SessionId}",
                message.SessionAppointmentId);
            return;
        }

        using var scope = _serviceScopeFactory.CreateScope();
        var emailService = scope.ServiceProvider.GetRequiredService<IEmailService>();

        var baseUrl = _configuration["App:BaseUrl"] ?? "https://skillswap.app";
        var sessionUrl = $"{baseUrl}/sessions/{message.SessionAppointmentId}";
        var scheduledTime = DateTime.Parse(message.ScheduledDate.ToString()).ToLocalTime();
        var organizerName = message.OrganizerName ?? "User";
        var participantName = message.ParticipantName ?? "Participant";

        var emailBody = BuildSessionStartedEmailHtml(
            organizerName,
            participantName,
            scheduledTime,
            sessionUrl,
            message.MeetingLink);

        try
        {
            // Send email to organizer
            await emailService.SendEmailAsync(
                to: message.OrganizerEmail,
                subject: $"🎥 Deine Session mit {participantName} hat begonnen!",
                htmlContent: emailBody,
                textContent: $"Your session with {participantName} has started. Click the link to join: {message.MeetingLink}");

            _logger.LogInformation(
                "Sent SessionStarted email to organizer {Email} for session {SessionId}",
                message.OrganizerEmail, message.SessionAppointmentId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "Failed to send SessionStarted email to organizer {Email}",
                message.OrganizerEmail);
        }
    }

    private string BuildSessionStartedEmailHtml(
        string organizerName,
        string participantName,
        DateTime scheduledTime,
        string sessionUrl,
        string? meetingLink)
    {
        return $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset=""utf-8"">
    <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"">
    <style>
        body {{ font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 20px auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }}
        .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; }}
        .header h1 {{ margin: 0; font-size: 28px; }}
        .content {{ padding: 30px; }}
        .session-info {{ background: #f8f9fa; padding: 20px; border-left: 4px solid #667eea; border-radius: 5px; margin: 20px 0; }}
        .cta-button {{ text-align: center; margin: 30px 0; }}
        .cta-button a {{ display: inline-block; background: #667eea; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-weight: 600; }}
        .footer {{ background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px; }}
    </style>
</head>
<body>
    <div class=""container"">
        <div class=""header"">
            <h1>🎥 Deine Session beginnt!</h1>
        </div>
        <div class=""content"">
            <p>Hi {organizerName},</p>
            <p>Deine Session mit <strong>{participantName}</strong> hat gerade begonnen!</p>
            <div class=""session-info"">
                <p><strong>📅 Uhrzeit:</strong> {scheduledTime:dd. MMMM yyyy 'um' HH:mm 'Uhr'}</p>
                <p><strong>👥 Teilnehmer:</strong> {participantName}</p>
                {(string.IsNullOrEmpty(meetingLink) ? "" : $@"<p><strong>🔗 Meeting Link:</strong><br><a href=""{meetingLink}"" style=""color: #667eea; text-decoration: none;"">{meetingLink}</a></p>")}
            </div>
            <div class=""cta-button"">
                <a href=""{sessionUrl}"">Zur Session</a>
                {(string.IsNullOrEmpty(meetingLink) ? "" : $@"<br><br><a href=""{meetingLink}"" style=""background: #28a745;"">🎥 Meeting beitreten</a>")}
            </div>
            <p>Viel Erfolg beim Lernen! 🚀</p>
        </div>
        <div class=""footer"">
            <p>Dein Skillswap Team</p>
        </div>
    </div>
</body>
</html>";
    }
}
