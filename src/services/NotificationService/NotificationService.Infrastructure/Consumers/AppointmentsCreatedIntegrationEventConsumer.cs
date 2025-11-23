using Events.Integration.Appointment;
using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;
using MassTransit;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Configuration;
using NotificationService.Domain.Services;
using NotificationService.Hubs;

namespace NotificationService.Infrastructure.Consumers;

/// <summary>
/// Consumes AppointmentsCreatedIntegrationEvent to send email notifications
/// to both users with all appointment details and meeting links
/// </summary>
public class AppointmentsCreatedIntegrationEventConsumer : IConsumer<AppointmentsCreatedIntegrationEvent>
{
    private readonly IServiceScopeFactory _serviceScopeFactory;
    private readonly IConfiguration _configuration;
    private readonly IHubContext<NotificationHub> _notificationHub;
    private readonly ILogger<AppointmentsCreatedIntegrationEventConsumer> _logger;

    public AppointmentsCreatedIntegrationEventConsumer(
        IServiceScopeFactory serviceScopeFactory,
        IConfiguration configuration,
        IHubContext<NotificationHub> notificationHub,
        ILogger<AppointmentsCreatedIntegrationEventConsumer> logger)
    {
        _serviceScopeFactory = serviceScopeFactory;
        _configuration = configuration;
        _notificationHub = notificationHub;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<AppointmentsCreatedIntegrationEvent> context)
    {
        var message = context.Message;
        _logger.LogInformation(
            "Sending appointment notifications for match {MatchId} - {Count} appointments created",
            message.MatchId, message.Appointments.Length);

        try
        {
            // Send emails to BOTH users in parallel
            await Task.WhenAll(
                SendAppointmentsEmailAsync(message, toOrganizer: true, context.CancellationToken),
                SendAppointmentsEmailAsync(message, toOrganizer: false, context.CancellationToken)
            );

            _logger.LogInformation(
                "Successfully sent appointment notification emails for match {MatchId}",
                message.MatchId);

            // Send real-time SignalR notifications to BOTH users
            await SendSignalRNotificationAsync(message, message.OrganizerUserId);
            await SendSignalRNotificationAsync(message, message.ParticipantUserId);

            _logger.LogInformation("Successfully sent SignalR notifications for match {MatchId}", message.MatchId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "Failed to send appointment notification emails for match {MatchId}",
                message.MatchId);
            throw;
        }
    }

    private async Task SendAppointmentsEmailAsync(
        AppointmentsCreatedIntegrationEvent message,
        bool toOrganizer,
        CancellationToken cancellationToken)
    {
        // Create a new scope to get a fresh DbContext instance for this parallel task
        using var scope = _serviceScopeFactory.CreateScope();
        var emailService = scope.ServiceProvider.GetRequiredService<IEmailService>();

        var (recipientEmail, recipientName, recipientUserId, partnerName) = toOrganizer
            ? (message.OrganizerEmail, message.OrganizerName, message.OrganizerUserId, message.ParticipantName)
            : (message.ParticipantEmail, message.ParticipantName, message.ParticipantUserId, message.OrganizerName);

        if (string.IsNullOrEmpty(recipientEmail))
        {
            _logger.LogWarning(
                "Cannot send appointment email to {Role} - email is empty",
                toOrganizer ? "organizer" : "participant");
            return;
        }

        var baseUrl = _configuration["App:BaseUrl"] ?? "https://skillswap.app";

        // Build email subject
        var subject = message.IsSkillExchange
            ? $"🎉 Deine {message.Appointments.Length} Skill-Tausch Sessions mit {partnerName} sind bereit!"
            : message.IsMonetary
                ? $"🎉 Deine {message.Appointments.Length} Sessions mit {partnerName} wurden gebucht!"
                : $"🎉 Deine {message.Appointments.Length} Sessions mit {partnerName} sind bereit!";

        // Build email body (HTML)
        var emailBody = BuildEmailHtml(message, recipientName, partnerName, toOrganizer, baseUrl);

        // Send email (HTML format) using the scoped email service
        await emailService.SendEmailAsync(
            to: recipientEmail,
            subject: subject,
            htmlContent: emailBody,
            textContent: $"Your {message.Appointments.Length} appointments with {partnerName} have been created. Please log in to view details.");

        _logger.LogInformation(
            "Sent appointments email to {RecipientEmail} for match {MatchId}",
            recipientEmail, message.MatchId);
    }

    private string BuildEmailHtml(
        AppointmentsCreatedIntegrationEvent message,
        string recipientName,
        string partnerName,
        bool isOrganizer,
        string baseUrl)
    {
        var sessionCount = message.Appointments.Length;
        var dashboardUrl = $"{baseUrl}/appointments";

        var html = $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset=""utf-8"">
    <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"">
    <style>
        body {{
            font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f5f5f5;
        }}
        .container {{
            max-width: 600px;
            margin: 20px auto;
            background: white;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }}
        .header {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
        }}
        .header h1 {{
            margin: 0 0 10px 0;
            font-size: 28px;
        }}
        .header p {{
            font-size: 16px;
            opacity: 0.9;
        }}
        .content {{
            padding: 30px;
        }}
        .intro {{
            margin-bottom: 30px;
        }}
        .session-card {{
            background: #f8f9fa;
            padding: 20px;
            margin: 15px 0;
            border-left: 4px solid #667eea;
            border-radius: 5px;
        }}
        .session-card h3 {{
            color: #667eea;
            font-size: 18px;
        }}
        .session-detail {{
            margin: 8px 0;
            font-size: 14px;
        }}
        .session-detail strong {{
            color: #555;
        }}
        .meeting-button {{
            display: inline-block;
            background: #667eea;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 5px;
            margin-top: 10px;
            font-weight: 600;
        }}
        .meeting-button:hover {{
            background: #5568d3;
        }}
        .info-box {{
            background: #e3f2fd;
            padding: 20px;
            border-radius: 5px;
            margin: 30px 0;
        }}
        .info-box h3 {{
            margin: 0 0 15px 0;
            color: #1976d2;
        }}
        .info-box ul {{
            margin: 10px 0;
            padding-left: 20px;
        }}
        .info-box li {{
            margin: 8px 0;
        }}
        .cta-button {{
            text-align: center;
            margin: 30px 0;
        }}
        .cta-button a {{
            display: inline-block;
            background: #28a745;
            color: white;
            padding: 15px 40px;
            text-decoration: none;
            border-radius: 5px;
            font-weight: 600;
        }}
        .cta-button a:hover {{
            background: #218838;
        }}
        .footer {{
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            color: #666;
            font-size: 12px;
        }}
        .footer p {{
            margin: 5px 0;
        }}
        .skill-badge {{
            display: inline-block;
            background: #667eea;
            color: white;
            padding: 5px 15px;
            border-radius: 20px;
            font-weight: 600;
        }}
        .exchange-badge {{
            background: #764ba2;
        }}
        .teacher-indicator {{
            display: inline-block;
            background: #ffc107;
            color: #333;
            padding: 4px 12px;
            border-radius: 15px;
            font-size: 13px;
            font-weight: 600;
        }}
    </style>
</head>
<body>
    <div class=""container"">
        <div class=""header"">
            <h1>🎉 Deine Sessions sind bereit!</h1>
            <p>{sessionCount} Session{(sessionCount > 1 ? "s" : "")} mit {partnerName} wurden erstellt</p>
        </div>
        <div class=""content"">
            <div class=""intro"">
                <p>Hi {recipientName},</p>
                <p>Großartig! Du und <strong>{partnerName}</strong> habt euch ";

        // Add skill exchange or payment info
        if (message.IsSkillExchange)
        {
            html += $@"für einen Skill-Tausch entschieden:</p>
                <p>
                    <span class=""skill-badge"">{message.SkillName}</span>
                    <span style=""font-size: 20px; margin: 0 10px;"">⇄</span>
                    <span class=""skill-badge exchange-badge"">{message.ExchangeSkillName}</span>
                </p>";
        }
        else if (message.IsMonetary)
        {
            html += $@"für bezahlte Sessions geeinigt:</p>
                <p>
                    <strong style=""margin-left: 15px;"">{message.AgreedAmount:F2} {message.Currency}/Session</strong>
                </p>";
        }
        else
        {
            html += $@"für Sessions geeinigt:</p>
                <p><span class=""skill-badge"">{message.SkillName}</span></p>";
        }

        html += @"
            </div>
            <h2 style=""color: #667eea; margin-top: 30px;"">📅 Deine Sessions:</h2>";

        // Add each appointment
        foreach (var apt in message.Appointments)
        {
            var scheduledDateTime = apt.ScheduledDate.ToLocalTime();
            var dayOfWeek = scheduledDateTime.ToString("dddd", new System.Globalization.CultureInfo("de-DE"));
            var dateFormatted = scheduledDateTime.ToString("dd. MMMM yyyy", new System.Globalization.CultureInfo("de-DE"));
            var timeFormatted = scheduledDateTime.ToString("HH:mm");

            html += $@"
            <div class=""session-card"">
                <h3>Session {apt.SessionNumber} von {apt.TotalSessions}</h3>
                <p class=""session-detail""><strong>📆 {dayOfWeek}, {dateFormatted}</strong></p>
                <p class=""session-detail""><strong>🕐 {timeFormatted} Uhr</strong> ({apt.DurationMinutes} Minuten)</p>";

            // Show teacher role for skill exchange
            if (message.IsSkillExchange && !string.IsNullOrEmpty(apt.TeacherRole))
            {
                var youTeach = (isOrganizer && apt.TeacherRole == "Organizer") ||
                               (!isOrganizer && apt.TeacherRole == "Participant");

                if (youTeach)
                {
                    html += $@"
                <p class=""session-detail"">
                    <span class=""teacher-indicator"">👨‍🏫 Du lehrst: {message.SkillName}</span>
                </p>";
                }
                else
                {
                    html += $@"
                <p class=""session-detail"">
                    <span class=""teacher-indicator"">👨‍🎓 {partnerName} lehrt: {message.ExchangeSkillName}</span>
                </p>";
                }
            }

            // Meeting link button
            if (!string.IsNullOrEmpty(apt.MeetingLink))
            {
                html += $@"
                <a href=""{apt.MeetingLink}"" class=""meeting-button"">🎥 Meeting beitreten</a>
                <p style=""margin-top: 5px; font-size: 12px; color: #666;"">Aktiv ab 5 Minuten vor Termin</p>";
            }

            html += @"
            </div>";
        }

        // Important info box
        html += @"
            <div class=""info-box"">
                <h3>💡 Wichtige Hinweise:</h3>
                <ul>
                    <li>Meeting Links sind ab <strong>5 Minuten vor Termin</strong> aktiv</li>
                    <li>Links sind für <strong>24 Stunden nach Termin</strong> gültig</li>
                    <li>Du kannst Termine in deinem Dashboard verwalten</li>";

        if (message.IsMonetary)
        {
            html += @"
                    <li>Zahlung erfolgt nach jeder abgeschlossenen Session</li>";
        }

        html += $@"
                </ul>
            </div>
            <div class=""cta-button"">
                <a href=""{dashboardUrl}"">📊 Zum Dashboard</a>
            </div>
        </div>
        <div class=""footer"">
            <p><strong>Viel Erfolg beim Lernen! 🚀</strong></p>
            <p>Dein Skillswap Team</p>
            <p style=""margin-top: 15px;""><small>Du erhältst diese Email, weil ein Match akzeptiert wurde.</small></p>
        </div>
    </div>
</body>
</html>";

        return html;
    }

    private async Task SendSignalRNotificationAsync(
        AppointmentsCreatedIntegrationEvent message,
        string userId)
    {
        try
        {
            // Map appointments to frontend format
            var appointmentsData = message.Appointments.Select(apt => new
            {
                id = apt.AppointmentId,
                title = apt.Title,
                scheduledDate = apt.ScheduledDate,
                durationMinutes = apt.DurationMinutes,
                sessionNumber = apt.SessionNumber,
                totalSessions = apt.TotalSessions,
                meetingLink = apt.MeetingLink,
                teacherRole = apt.TeacherRole,
                status = "Confirmed",
                isSkillExchange = message.IsSkillExchange,
                isMonetary = message.IsMonetary,
                skillName = message.SkillName,
                exchangeSkillName = message.ExchangeSkillName,
                amount = message.AgreedAmount,
                currency = message.Currency,
                matchId = message.MatchId,
                organizerUserId = message.OrganizerUserId,
                participantUserId = message.ParticipantUserId,
                partnerName = userId == message.OrganizerUserId
                    ? message.ParticipantName
                    : message.OrganizerName
            }).ToArray();

            // Send to SignalR hub
            await NotificationHub.SendNewAppointmentsToUser(
                _notificationHub,
                userId,
                appointmentsData);

            _logger.LogInformation(
                "Sent SignalR notification with {Count} appointments to user {UserId}",
                appointmentsData.Length, userId);
        }
        catch (Exception ex)
        {
            // SignalR failure should not break the email flow
            _logger.LogWarning(ex,
                "Failed to send SignalR notification to user {UserId}. User may not be connected.",
                userId);
        }
    }
}
