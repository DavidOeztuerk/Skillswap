using NotificationService.Domain.Entities;

namespace NotificationService.Domain.Repositories;

public interface IScheduledReminderRepository
{
    Task<ScheduledReminder?> GetByIdAsync(string id, CancellationToken cancellationToken = default);
    Task<List<ScheduledReminder>> GetByAppointmentIdAsync(string appointmentId, CancellationToken cancellationToken = default);
    Task<List<ScheduledReminder>> GetByUserIdAsync(string userId, CancellationToken cancellationToken = default);
    Task<List<ScheduledReminder>> GetPendingRemindersAsync(DateTime before, CancellationToken cancellationToken = default);
    Task<ScheduledReminder> CreateAsync(ScheduledReminder reminder, CancellationToken cancellationToken = default);
    Task CreateManyAsync(IEnumerable<ScheduledReminder> reminders, CancellationToken cancellationToken = default);
    Task<ScheduledReminder> UpdateAsync(ScheduledReminder reminder, CancellationToken cancellationToken = default);
    Task CancelByAppointmentIdAsync(string appointmentId, CancellationToken cancellationToken = default);
    Task DeleteByAppointmentIdAsync(string appointmentId, CancellationToken cancellationToken = default);
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
