using AppointmentService.Domain.Entities;
using AppointmentService.Infrastructure.Data;
using Infrastructure.Communication;
using Contracts.Notification.Requests;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace AppointmentService.Infrastructure.BackgroundServices;

/// <summary>
/// Background service that sends reminders for upcoming appointments
/// Runs every 1 minute and sends notifications 5 minutes before appointment start
/// </summary>
public class AppointmentReminderScheduler : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<AppointmentReminderScheduler> _logger;
    private readonly TimeSpan _checkInterval = TimeSpan.FromMinutes(1);
    private readonly TimeSpan _reminderWindow = TimeSpan.FromMinutes(5);

    public AppointmentReminderScheduler(
        IServiceProvider serviceProvider,
        ILogger<AppointmentReminderScheduler> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("AppointmentReminderScheduler started");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcessUpcomingReminders(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing appointment reminders");
            }

            // Wait for next check interval
            await Task.Delay(_checkInterval, stoppingToken);
        }

        _logger.LogInformation("AppointmentReminderScheduler stopped");
    }

    private async Task ProcessUpcomingReminders(CancellationToken cancellationToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppointmentDbContext>();
        var serviceCommunication = scope.ServiceProvider.GetRequiredService<IServiceCommunicationManager>();

        var now = DateTime.UtcNow;
        var reminderTime = now.Add(_reminderWindow);

        // Find appointments that:
        // 1. Are accepted
        // 2. Start within the next 5 minutes
        // 3. Haven't been reminded yet (or reminder was sent more than 6 minutes ago to avoid duplicates)
        var upcomingAppointments = await dbContext.Appointments
            .Where(a => a.Status == AppointmentStatus.Accepted)
            .Where(a => a.ScheduledDate > now && a.ScheduledDate <= reminderTime)
            .Where(a => a.ReminderSentAt == null || a.ReminderSentAt < now.AddMinutes(-6))
            .ToListAsync(cancellationToken);

        if (upcomingAppointments.Any())
        {
            _logger.LogInformation("Found {Count} appointments requiring reminders", upcomingAppointments.Count);

            foreach (var appointment in upcomingAppointments)
            {
                try
                {
                    await SendAppointmentReminder(appointment, serviceCommunication, cancellationToken);

                    // Mark reminder as sent
                    appointment.ReminderSentAt = DateTime.UtcNow;
                    await dbContext.SaveChangesAsync(cancellationToken);

                    _logger.LogInformation("Reminder sent for appointment {AppointmentId}", appointment.Id);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to send reminder for appointment {AppointmentId}", appointment.Id);
                }
            }
        }
    }

    private async Task SendAppointmentReminder(
        Appointment appointment,
        IServiceCommunicationManager serviceCommunication,
        CancellationToken cancellationToken)
    {
        var timeUntilStart = appointment.ScheduledDate - DateTime.UtcNow;
        var minutesUntilStart = (int)timeUntilStart.TotalMinutes;

        // Prepare template variables
        var variables = new Dictionary<string, string>
        {
            { "appointmentId", appointment.Id },
            { "title", appointment.Title },
            { "startTime", appointment.ScheduledDate.ToString("HH:mm") },
            { "date", appointment.ScheduledDate.ToString("dd.MM.yyyy") },
            { "minutesUntilStart", minutesUntilStart.ToString() },
            { "duration", appointment.DurationMinutes.ToString() },
            { "meetingLink", appointment.MeetingLink ?? "" },
            { "actionUrl", $"/appointments/{appointment.Id}" }
        };

        // Send reminder to organizer
        var organizerNotification = new SendNotificationRequest(
            Type: "InApp",
            Template: "AppointmentReminder",
            Recipient: appointment.OrganizerUserId,
            Variables: variables,
            Priority: "High",
            ScheduledAt: null,
            CorrelationId: $"appointment-reminder-{appointment.Id}"
        );

        // Send reminder to participant
        var participantNotification = new SendNotificationRequest(
            Type: "InApp",
            Template: "AppointmentReminder",
            Recipient: appointment.ParticipantUserId,
            Variables: variables,
            Priority: "High",
            ScheduledAt: null,
            CorrelationId: $"appointment-reminder-{appointment.Id}"
        );

        try
        {
            // Send both notifications in parallel
            var organizerTask = serviceCommunication.SendRequestAsync<SendNotificationRequest, object>(
                "NotificationService",
                "api/notifications/send",
                organizerNotification,
                cancellationToken);

            var participantTask = serviceCommunication.SendRequestAsync<SendNotificationRequest, object>(
                "NotificationService",
                "api/notifications/send",
                participantNotification,
                cancellationToken);

            await Task.WhenAll(organizerTask, participantTask);

            _logger.LogInformation(
                "Sent appointment reminders for {AppointmentId} to organizer {OrganizerId} and participant {ParticipantId}",
                appointment.Id, appointment.OrganizerUserId, appointment.ParticipantUserId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send notification for appointment {AppointmentId}", appointment.Id);
            throw;
        }
    }
}
