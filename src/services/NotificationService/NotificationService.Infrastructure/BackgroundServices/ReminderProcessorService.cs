using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using NotificationService.Domain.Repositories;
using NotificationService.Domain.Services;
using NotificationService.Infrastructure.Data;

namespace NotificationService.Infrastructure.BackgroundServices;

/// <summary>
/// Background service that processes scheduled reminders every 30 seconds
/// </summary>
public class ReminderProcessorService : BackgroundService
{
    private readonly IServiceScopeFactory _serviceScopeFactory;
    private readonly ILogger<ReminderProcessorService> _logger;
    private readonly TimeSpan _checkInterval = TimeSpan.FromSeconds(30);

    public ReminderProcessorService(
        IServiceScopeFactory serviceScopeFactory,
        ILogger<ReminderProcessorService> logger)
    {
        _serviceScopeFactory = serviceScopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("ReminderProcessorService starting...");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcessPendingRemindersAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing reminders");
            }

            await Task.Delay(_checkInterval, stoppingToken);
        }

        _logger.LogInformation("ReminderProcessorService stopped");
    }

    private async Task ProcessPendingRemindersAsync(CancellationToken cancellationToken)
    {
        await using var scope = _serviceScopeFactory.CreateAsyncScope();
        var unitOfWork = scope.ServiceProvider.GetRequiredService<INotificationUnitOfWork>();
        var orchestrator = scope.ServiceProvider.GetRequiredService<INotificationOrchestrator>();
        var userServiceClient = scope.ServiceProvider.GetRequiredService<IUserServiceClient>();

        // Get all pending reminders that should be sent now
        var pendingReminders = await unitOfWork.ScheduledReminders
            .GetPendingRemindersAsync(DateTime.UtcNow, cancellationToken);

        if (pendingReminders.Count == 0)
        {
            return;
        }

        _logger.LogInformation("Processing {Count} pending reminders", pendingReminders.Count);

        foreach (var reminder in pendingReminders)
        {
            try
            {
                await ProcessSingleReminderAsync(reminder, orchestrator, userServiceClient, unitOfWork, cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing reminder {ReminderId}", reminder.Id);

                // Mark as failed
                reminder.Status = "Failed";
                reminder.ErrorMessage = ex.Message;
                await unitOfWork.ScheduledReminders.UpdateAsync(reminder, cancellationToken);
            }
        }

        await unitOfWork.SaveChangesAsync(cancellationToken);
    }

    private async Task ProcessSingleReminderAsync(
        Domain.Entities.ScheduledReminder reminder,
        INotificationOrchestrator orchestrator,
        IUserServiceClient userServiceClient,
        INotificationUnitOfWork unitOfWork,
        CancellationToken cancellationToken)
    {
        _logger.LogDebug("Processing reminder {ReminderId} for appointment {AppointmentId}, type {ReminderType}",
            reminder.Id, reminder.AppointmentId, reminder.ReminderType);

        // Get user contact info
        var contactInfo = await userServiceClient.GetUserContactInfoAsync(
            new List<string> { reminder.UserId },
            cancellationToken);

        var userContact = contactInfo.FirstOrDefault();
        if (userContact == null)
        {
            _logger.LogWarning("Could not get contact info for user {UserId}", reminder.UserId);
            reminder.Status = "Failed";
            reminder.ErrorMessage = "Could not retrieve user contact information";
            await unitOfWork.ScheduledReminders.UpdateAsync(reminder, cancellationToken);
            return;
        }

        // Build notification variables
        var variables = new Dictionary<string, string>
        {
            ["RecipientFirstName"] = userContact.FirstName ?? "there",
            ["PartnerName"] = reminder.PartnerName ?? "your partner",
            ["SkillName"] = reminder.SkillName ?? "the skill",
            ["MinutesUntil"] = reminder.MinutesBefore.ToString(),
            ["MeetingLink"] = reminder.MeetingLink ?? "",
            ["ScheduledDate"] = reminder.AppointmentTime?.ToString("dd.MM.yyyy") ?? "",
            ["ScheduledTime"] = reminder.AppointmentTime?.ToString("HH:mm") ?? ""
        };

        // Add formatted time until
        var timeUntil = FormatTimeUntil(reminder.MinutesBefore);
        variables["TimeUntil"] = timeUntil;

        bool success = false;

        switch (reminder.ReminderType.ToUpperInvariant())
        {
            case "EMAIL":
                if (!string.IsNullOrEmpty(userContact.Email))
                {
                    success = await orchestrator.SendImmediateNotificationAsync(
                        reminder.UserId,
                        "EMAIL",
                        "appointment-reminder",
                        userContact.Email,
                        variables);
                }
                else
                {
                    _logger.LogWarning("No email address for user {UserId}", reminder.UserId);
                    reminder.ErrorMessage = "No email address available";
                }
                break;

            case "PUSH":
                var pushVariables = new Dictionary<string, string>(variables)
                {
                    ["Title"] = $"Reminder: {reminder.SkillName ?? "Appointment"} in {timeUntil}",
                    ["Body"] = $"Your session with {reminder.PartnerName ?? "your partner"} starts in {timeUntil}"
                };
                success = await orchestrator.SendImmediateNotificationAsync(
                    reminder.UserId,
                    "PUSH",
                    "appointment-reminder",
                    reminder.UserId,
                    pushVariables);
                break;

            case "SMS":
                if (!string.IsNullOrEmpty(userContact.PhoneNumber))
                {
                    success = await orchestrator.SendImmediateNotificationAsync(
                        reminder.UserId,
                        "SMS",
                        "appointment-reminder",
                        userContact.PhoneNumber,
                        variables);
                }
                else
                {
                    _logger.LogWarning("No phone number for user {UserId}", reminder.UserId);
                    reminder.ErrorMessage = "No phone number available";
                }
                break;
        }

        // Update reminder status
        if (success)
        {
            reminder.Status = "Sent";
            reminder.SentAt = DateTime.UtcNow;
            _logger.LogInformation("Successfully sent {ReminderType} reminder {ReminderId} for appointment {AppointmentId}",
                reminder.ReminderType, reminder.Id, reminder.AppointmentId);
        }
        else
        {
            reminder.Status = "Failed";
            if (string.IsNullOrEmpty(reminder.ErrorMessage))
            {
                reminder.ErrorMessage = "Failed to send notification";
            }
            _logger.LogWarning("Failed to send {ReminderType} reminder {ReminderId} for appointment {AppointmentId}",
                reminder.ReminderType, reminder.Id, reminder.AppointmentId);
        }

        await unitOfWork.ScheduledReminders.UpdateAsync(reminder, cancellationToken);
    }

    private static string FormatTimeUntil(int minutes)
    {
        return minutes switch
        {
            < 60 => $"{minutes} minutes",
            60 => "1 hour",
            < 1440 => $"{minutes / 60} hours",
            1440 => "1 day",
            _ => $"{minutes / 1440} days"
        };
    }
}
