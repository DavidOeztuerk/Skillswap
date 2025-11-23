namespace AppointmentService.Domain.Services;

public interface INotificationServiceClient
{
    Task<bool> SendAppointmentCreatedNotificationAsync(string userId, string appointmentId,
        string appointmentTitle, DateTime scheduledDate, CancellationToken cancellationToken = default);

    Task<bool> SendAppointmentAcceptedNotificationAsync(string userId, string appointmentId,
        string appointmentTitle, DateTime scheduledDate, CancellationToken cancellationToken = default);

    Task<bool> SendAppointmentCancelledNotificationAsync(string userId, string appointmentId,
        string appointmentTitle, string cancelReason, CancellationToken cancellationToken = default);

    Task<bool> SendAppointmentReminderNotificationAsync(string userId, string appointmentId,
        string appointmentTitle, DateTime scheduledDate, int minutesBefore = 15, CancellationToken cancellationToken = default);

    Task<bool> SendAppointmentRescheduledNotificationAsync(string userId, string appointmentId,
        string appointmentTitle, DateTime oldDate, DateTime newDate, CancellationToken cancellationToken = default);
}
