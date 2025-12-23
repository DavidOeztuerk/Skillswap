using Microsoft.EntityFrameworkCore;
using UserService.Domain.Models;
using UserService.Domain.Repositories;

namespace UserService.Infrastructure.Repositories;

/// <summary>
/// Repository implementation for appointment calendar event mappings
/// </summary>
public class AppointmentCalendarEventRepository(UserDbContext dbContext)
    : IAppointmentCalendarEventRepository
{
    private readonly UserDbContext _dbContext = dbContext;

    public async Task<List<AppointmentCalendarEvent>> GetByAppointmentIdAsync(
        string appointmentId,
        CancellationToken cancellationToken = default)
    {
        return await _dbContext.AppointmentCalendarEvents
            .Where(e => e.AppointmentId == appointmentId)
            .ToListAsync(cancellationToken);
    }

    public async Task<AppointmentCalendarEvent?> GetByAppointmentAndUserAsync(
        string appointmentId,
        string userId,
        string provider,
        CancellationToken cancellationToken = default)
    {
        return await _dbContext.AppointmentCalendarEvents
            .FirstOrDefaultAsync(e =>
                e.AppointmentId == appointmentId &&
                e.UserId == userId &&
                e.Provider == provider,
                cancellationToken);
    }

    public async Task<List<AppointmentCalendarEvent>> GetByUserIdAsync(
        string userId,
        CancellationToken cancellationToken = default)
    {
        return await _dbContext.AppointmentCalendarEvents
            .Where(e => e.UserId == userId)
            .ToListAsync(cancellationToken);
    }

    public async Task<AppointmentCalendarEvent?> GetByExternalEventIdAsync(
        string externalEventId,
        string provider,
        CancellationToken cancellationToken = default)
    {
        return await _dbContext.AppointmentCalendarEvents
            .FirstOrDefaultAsync(e =>
                e.ExternalEventId == externalEventId &&
                e.Provider == provider,
                cancellationToken);
    }

    public async Task<AppointmentCalendarEvent> AddAsync(
        AppointmentCalendarEvent calendarEvent,
        CancellationToken cancellationToken = default)
    {
        await _dbContext.AppointmentCalendarEvents.AddAsync(calendarEvent, cancellationToken);
        return calendarEvent;
    }

    public Task UpdateAsync(
        AppointmentCalendarEvent calendarEvent,
        CancellationToken cancellationToken = default)
    {
        calendarEvent.UpdatedAt = DateTime.UtcNow;
        _dbContext.AppointmentCalendarEvents.Update(calendarEvent);
        return Task.CompletedTask;
    }

    public Task DeleteAsync(
        AppointmentCalendarEvent calendarEvent,
        CancellationToken cancellationToken = default)
    {
        _dbContext.AppointmentCalendarEvents.Remove(calendarEvent);
        return Task.CompletedTask;
    }

    public async Task DeleteByAppointmentIdAsync(
        string appointmentId,
        CancellationToken cancellationToken = default)
    {
        var events = await GetByAppointmentIdAsync(appointmentId, cancellationToken);
        _dbContext.AppointmentCalendarEvents.RemoveRange(events);
    }

    public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return await _dbContext.SaveChangesAsync(cancellationToken);
    }
}
