using Infrastructure.Communication;
using Contracts.Notification.Requests;
using Contracts.Notification.Responses;
using Microsoft.Extensions.Logging;
using AppointmentService.Domain.Services;

namespace AppointmentService.Infrastructure.HttpClients;

public class NotificationServiceClient : INotificationServiceClient
{
    private readonly IServiceCommunicationManager _serviceCommunication;
    private readonly ILogger<NotificationServiceClient> _logger;

    public NotificationServiceClient(IServiceCommunicationManager serviceCommunication, ILogger<NotificationServiceClient> logger)
    {
        _serviceCommunication = serviceCommunication;
        _logger = logger;
    }

    public async Task<bool> SendAppointmentCreatedNotificationAsync(string userId, string appointmentId,
        string appointmentTitle, DateTime scheduledDate, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogDebug("Sending appointment created notification to {UserId} for {AppointmentId}", userId, appointmentId);

            var request = new SendNotificationRequest(
                Type: "Email",
                Template: "AppointmentCreated",
                Recipient: userId,
                Variables: new Dictionary<string, string>
                {
                    ["appointmentId"] = appointmentId,
                    ["appointmentTitle"] = appointmentTitle,
                    ["scheduledDate"] = scheduledDate.ToString("O"),
                    ["title"] = "New Appointment Scheduled",
                    ["message"] = $"Your appointment '{appointmentTitle}' has been scheduled for {scheduledDate:yyyy-MM-dd HH:mm}"
                });

            var response = await _serviceCommunication.SendRequestAsync<SendNotificationRequest, SendNotificationResponse>(
                "notificationservice",
                "api/notifications/send",
                request,
                cancellationToken);

            var success = response != null;
            _logger.LogDebug("Appointment created notification sent: {Success}", success);
            return success;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending appointment created notification for {AppointmentId}", appointmentId);
            return false;
        }
    }

    public async Task<bool> SendAppointmentAcceptedNotificationAsync(string userId, string appointmentId,
        string appointmentTitle, DateTime scheduledDate, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogDebug("Sending appointment accepted notification to {UserId} for {AppointmentId}", userId, appointmentId);

            var request = new SendNotificationRequest(
                Type: "Email",
                Template: "AppointmentAccepted",
                Recipient: userId,
                Variables: new Dictionary<string, string>
                {
                    ["appointmentId"] = appointmentId,
                    ["appointmentTitle"] = appointmentTitle,
                    ["scheduledDate"] = scheduledDate.ToString("O"),
                    ["title"] = "Appointment Confirmed",
                    ["message"] = $"Your appointment '{appointmentTitle}' for {scheduledDate:yyyy-MM-dd HH:mm} has been confirmed"
                });

            var response = await _serviceCommunication.SendRequestAsync<SendNotificationRequest, SendNotificationResponse>(
                "notificationservice",
                "api/notifications/send",
                request,
                cancellationToken);

            var success = response != null;
            _logger.LogDebug("Appointment accepted notification sent: {Success}", success);
            return success;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending appointment accepted notification for {AppointmentId}", appointmentId);
            return false;
        }
    }

    public async Task<bool> SendAppointmentCancelledNotificationAsync(string userId, string appointmentId,
        string appointmentTitle, string cancelReason, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogDebug("Sending appointment cancelled notification to {UserId} for {AppointmentId}", userId, appointmentId);

            var request = new SendNotificationRequest(
                Type: "Email",
                Template: "AppointmentCancelled",
                Recipient: userId,
                Variables: new Dictionary<string, string>
                {
                    ["appointmentId"] = appointmentId,
                    ["appointmentTitle"] = appointmentTitle,
                    ["cancelReason"] = cancelReason,
                    ["title"] = "Appointment Cancelled",
                    ["message"] = $"Your appointment '{appointmentTitle}' has been cancelled. Reason: {cancelReason}"
                });

            var response = await _serviceCommunication.SendRequestAsync<SendNotificationRequest, SendNotificationResponse>(
                "notificationservice",
                "api/notifications/send",
                request,
                cancellationToken);

            var success = response != null;
            _logger.LogDebug("Appointment cancelled notification sent: {Success}", success);
            return success;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending appointment cancelled notification for {AppointmentId}", appointmentId);
            return false;
        }
    }

    public async Task<bool> SendAppointmentReminderNotificationAsync(string userId, string appointmentId,
        string appointmentTitle, DateTime scheduledDate, int minutesBefore = 15, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogDebug("Sending appointment reminder notification to {UserId} for {AppointmentId}", userId, appointmentId);

            var request = new SendNotificationRequest(
                Type: "Email",
                Template: "AppointmentReminder",
                Recipient: userId,
                Variables: new Dictionary<string, string>
                {
                    ["appointmentId"] = appointmentId,
                    ["appointmentTitle"] = appointmentTitle,
                    ["scheduledDate"] = scheduledDate.ToString("O"),
                    ["minutesBefore"] = minutesBefore.ToString(),
                    ["title"] = "Appointment Reminder",
                    ["message"] = $"Reminder: Your appointment '{appointmentTitle}' is starting in {minutesBefore} minutes"
                });

            var response = await _serviceCommunication.SendRequestAsync<SendNotificationRequest, SendNotificationResponse>(
                "notificationservice",
                "api/notifications/send",
                request,
                cancellationToken);

            var success = response != null;
            _logger.LogDebug("Appointment reminder notification sent: {Success}", success);
            return success;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending appointment reminder notification for {AppointmentId}", appointmentId);
            return false;
        }
    }

    public async Task<bool> SendAppointmentRescheduledNotificationAsync(string userId, string appointmentId,
        string appointmentTitle, DateTime oldDate, DateTime newDate, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogDebug("Sending appointment rescheduled notification to {UserId} for {AppointmentId}", userId, appointmentId);

            var request = new SendNotificationRequest(
                Type: "Email",
                Template: "AppointmentRescheduled",
                Recipient: userId,
                Variables: new Dictionary<string, string>
                {
                    ["appointmentId"] = appointmentId,
                    ["appointmentTitle"] = appointmentTitle,
                    ["oldDate"] = oldDate.ToString("O"),
                    ["newDate"] = newDate.ToString("O"),
                    ["title"] = "Appointment Rescheduled",
                    ["message"] = $"Your appointment '{appointmentTitle}' has been rescheduled from {oldDate:yyyy-MM-dd HH:mm} to {newDate:yyyy-MM-dd HH:mm}"
                });

            var response = await _serviceCommunication.SendRequestAsync<SendNotificationRequest, SendNotificationResponse>(
                "notificationservice",
                "api/notifications/send",
                request,
                cancellationToken);

            var success = response != null;
            _logger.LogDebug("Appointment rescheduled notification sent: {Success}", success);
            return success;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending appointment rescheduled notification for {AppointmentId}", appointmentId);
            return false;
        }
    }
}