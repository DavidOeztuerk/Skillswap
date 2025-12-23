using Microsoft.EntityFrameworkCore;
using NotificationService.Domain.Entities;
using NotificationService.Domain.Repositories;
using NotificationService.Infrastructure.Data;

namespace NotificationService.Infrastructure.Repositories;

public class ScheduledReminderRepository : IScheduledReminderRepository
{
    private readonly NotificationDbContext _dbContext;

    public ScheduledReminderRepository(NotificationDbContext dbContext)
    {
        _dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
    }

    public async Task<ScheduledReminder?> GetByIdAsync(string id, CancellationToken cancellationToken = default)
    {
        return await _dbContext.ScheduledReminders
            .FirstOrDefaultAsync(r => r.Id == id, cancellationToken);
    }

    public async Task<List<ScheduledReminder>> GetByAppointmentIdAsync(string appointmentId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.ScheduledReminders
            .Where(r => r.AppointmentId == appointmentId)
            .OrderBy(r => r.ScheduledFor)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<ScheduledReminder>> GetByUserIdAsync(string userId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.ScheduledReminders
            .Where(r => r.UserId == userId && r.Status == "Pending")
            .OrderBy(r => r.ScheduledFor)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<ScheduledReminder>> GetPendingRemindersAsync(DateTime before, CancellationToken cancellationToken = default)
    {
        return await _dbContext.ScheduledReminders
            .Where(r => r.Status == "Pending" && r.ScheduledFor <= before)
            .OrderBy(r => r.ScheduledFor)
            .ToListAsync(cancellationToken);
    }

    public async Task<ScheduledReminder> CreateAsync(ScheduledReminder reminder, CancellationToken cancellationToken = default)
    {
        await _dbContext.ScheduledReminders.AddAsync(reminder, cancellationToken);
        return reminder;
    }

    public async Task CreateManyAsync(IEnumerable<ScheduledReminder> reminders, CancellationToken cancellationToken = default)
    {
        await _dbContext.ScheduledReminders.AddRangeAsync(reminders, cancellationToken);
    }

    public async Task<ScheduledReminder> UpdateAsync(ScheduledReminder reminder, CancellationToken cancellationToken = default)
    {
        _dbContext.ScheduledReminders.Update(reminder);
        return await Task.FromResult(reminder);
    }

    public async Task CancelByAppointmentIdAsync(string appointmentId, CancellationToken cancellationToken = default)
    {
        var reminders = await _dbContext.ScheduledReminders
            .Where(r => r.AppointmentId == appointmentId && r.Status == "Pending")
            .ToListAsync(cancellationToken);

        foreach (var reminder in reminders)
        {
            reminder.Status = "Cancelled";
        }
    }

    public async Task DeleteByAppointmentIdAsync(string appointmentId, CancellationToken cancellationToken = default)
    {
        var reminders = await _dbContext.ScheduledReminders
            .Where(r => r.AppointmentId == appointmentId)
            .ToListAsync(cancellationToken);

        _dbContext.ScheduledReminders.RemoveRange(reminders);
    }

    public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return await _dbContext.SaveChangesAsync(cancellationToken);
    }
}
