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
/// Consumes SessionCompletedIntegrationEvent to send notifications
/// when a session is marked as completed or no-show
/// </summary>
public class SessionCompletedIntegrationEventConsumer : IConsumer<SessionCompletedIntegrationEvent>
{
    private readonly IServiceScopeFactory _serviceScopeFactory;
    private readonly IConfiguration _configuration;
    private readonly IHubContext<NotificationHub> _notificationHub;
    private readonly ILogger<SessionCompletedIntegrationEventConsumer> _logger;

    public SessionCompletedIntegrationEventConsumer(
        IServiceScopeFactory serviceScopeFactory,
        IConfiguration configuration,
        IHubContext<NotificationHub> notificationHub,
        ILogger<SessionCompletedIntegrationEventConsumer> logger)
    {
        _serviceScopeFactory = serviceScopeFactory;
        _configuration = configuration;
        _notificationHub = notificationHub;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<SessionCompletedIntegrationEvent> context)
    {
        var message = context.Message;
        _logger.LogInformation(
            "Processing SessionCompletedIntegrationEvent for session {SessionId}, IsNoShow: {IsNoShow}",
            message.SessionAppointmentId, message.IsNoShow);

        try
        {
            // Send real-time notifications to both participants
            await Task.WhenAll(
                SendSessionCompletedNotificationAsync(message, message.OrganizerUserId, context.CancellationToken),
                SendSessionCompletedNotificationAsync(message, message.ParticipantUserId, context.CancellationToken)
            );

            // Send email notifications
            await Task.WhenAll(
                SendSessionCompletedEmailAsync(message, toOrganizer: true, context.CancellationToken),
                SendSessionCompletedEmailAsync(message, toOrganizer: false, context.CancellationToken)
            );

            _logger.LogInformation(
                "Successfully processed SessionCompletedIntegrationEvent for session {SessionId}",
                message.SessionAppointmentId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "Failed to process SessionCompletedIntegrationEvent for session {SessionId}",
                message.SessionAppointmentId);
            throw;
        }
    }

    private async Task SendSessionCompletedNotificationAsync(
        SessionCompletedIntegrationEvent message,
        string userId,
        CancellationToken cancellationToken)
    {
        try
        {
            var partnerName = userId == message.OrganizerUserId
                ? (message.ParticipantName ?? "Participant")
                : (message.OrganizerName ?? "Organizer");

            var status = message.IsNoShow ? "No-Show" : "Completed";
            var statusMessage = message.IsNoShow
                ? $"Your session with {partnerName} was marked as no-show."
                : $"Your session with {partnerName} has been completed successfully!";

            var notification = new
            {
                type = "SessionCompleted",
                sessionId = message.SessionAppointmentId,
                status = status,
                isNoShow = message.IsNoShow,
                partnerName = partnerName,
                message = statusMessage,
                paymentAmount = message.PaymentAmount,
                timestamp = DateTime.UtcNow
            };

            await _notificationHub.Clients
                .User(userId)
                .SendAsync("ReceiveSessionNotification", notification, cancellationToken);

            _logger.LogInformation(
                "Sent SessionCompleted notification to user {UserId} for session {SessionId}",
                userId, message.SessionAppointmentId);
        }
        catch (Exception ex)
        {
            // SignalR failure should not break the process
            _logger.LogWarning(ex,
                "Failed to send SessionCompleted SignalR notification to user {UserId}. User may not be connected.",
                userId);
        }
    }

    private async Task SendSessionCompletedEmailAsync(
        SessionCompletedIntegrationEvent message,
        bool toOrganizer,
        CancellationToken cancellationToken)
    {
        var (recipientEmail, recipientName, partnerName) = toOrganizer
            ? (message.OrganizerEmail, message.OrganizerName, message.ParticipantName)
            : (message.ParticipantEmail, message.ParticipantName, message.OrganizerName);

        if (string.IsNullOrEmpty(recipientEmail))
        {
            _logger.LogWarning(
                "Cannot send SessionCompleted email - recipient email is empty for {Role}",
                toOrganizer ? "organizer" : "participant");
            return;
        }

        using var scope = _serviceScopeFactory.CreateScope();
        var emailService = scope.ServiceProvider.GetRequiredService<IEmailService>();

        // Use fallback names if not provided
        recipientName = recipientName ?? (toOrganizer ? "Organizer" : "Participant");
        partnerName = partnerName ?? (toOrganizer ? "Participant" : "Organizer");

        var baseUrl = _configuration["App:BaseUrl"] ?? "https://skillswap.app";
        var sessionUrl = $"{baseUrl}/sessions/{message.SessionAppointmentId}";

        var emailBody = BuildSessionCompletedEmailHtml(
            recipientName,
            partnerName,
            message.IsNoShow,
            message.PaymentAmount ?? 0,
            sessionUrl);

        var subject = message.IsNoShow
            ? $"⚠️ Deine Session mit {partnerName} wurde als No-Show markiert"
            : $"✅ Deine Session mit {partnerName} ist abgeschlossen";

        try
        {
            await emailService.SendEmailAsync(
                to: recipientEmail,
                subject: subject,
                htmlContent: emailBody,
                textContent: message.IsNoShow
                    ? $"Your session with {partnerName} was marked as no-show."
                    : $"Your session with {partnerName} has been completed. You can now rate the session.");

            _logger.LogInformation(
                "Sent SessionCompleted email to {Email} for session {SessionId}",
                recipientEmail, message.SessionAppointmentId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "Failed to send SessionCompleted email to {Email}",
                recipientEmail);
        }
    }

    private string BuildSessionCompletedEmailHtml(
        string recipientName,
        string partnerName,
        bool isNoShow,
        decimal paymentAmount,
        string sessionUrl)
    {
        var statusSection = isNoShow
            ? @"
            <div style=""background: #fff3cd; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;"">
                <h3 style=""color: #856404; margin-top: 0;"">⚠️ Session marked as No-Show</h3>
                <p>Diese Session wurde als Nichterscheinen markiert. Das kann Auswirkungen auf Ihre Bewertung haben.</p>
            </div>"
            : @"
            <div style=""background: #d4edda; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #28a745;"">
                <h3 style=""color: #155724; margin-top: 0;"">✅ Session erfolgreich abgeschlossen</h3>
                <p>Die Session war erfolgreich! Bitte bewerten Sie Ihren Lernpartner.</p>
            </div>";

        var paymentSection = paymentAmount > 0
            ? $@"
            <div style=""background: #e7f3ff; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #2196F3;"">
                <h3 style=""color: #1565c0; margin-top: 0;"">💰 Zahlungsinformation</h3>
                <p><strong>Betrag:</strong> €{paymentAmount:F2}</p>
                <p>Die Zahlung wird gemäß den Zahlungsbedingungen verarbeitet.</p>
            </div>"
            : "";

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
        .cta-button {{ text-align: center; margin: 30px 0; }}
        .cta-button a {{ display: inline-block; background: #667eea; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-weight: 600; }}
        .footer {{ background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px; }}
    </style>
</head>
<body>
    <div class=""container"">
        <div class=""header"">
            <h1>{(isNoShow ? "⚠️ Session No-Show" : "✅ Session Completed")}</h1>
        </div>
        <div class=""content"">
            <p>Hi {recipientName},</p>
            {statusSection}
            {paymentSection}
            <div class=""cta-button"">
                <a href=""{sessionUrl}"">Session Details anzeigen</a>
            </div>
            <p>Bei Fragen kontaktieren Sie uns bitte über das Dashboard.</p>
        </div>
        <div class=""footer"">
            <p>Dein Skillswap Team</p>
        </div>
    </div>
</body>
</html>";
    }
}
