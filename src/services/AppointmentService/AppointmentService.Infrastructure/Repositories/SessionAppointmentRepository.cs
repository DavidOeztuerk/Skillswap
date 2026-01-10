using AppointmentService.Domain.Entities;
using AppointmentService.Domain.Enums;
using AppointmentService.Domain.Repositories;
using AppointmentService.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace AppointmentService.Infrastructure.Repositories;

public class SessionAppointmentRepository : ISessionAppointmentRepository
{
    private readonly AppointmentDbContext _dbContext;

    public SessionAppointmentRepository(AppointmentDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<SessionAppointment?> GetByIdAsync(string appointmentId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.SessionAppointments.FirstOrDefaultAsync(a => a.Id == appointmentId, cancellationToken);
    }

    public async Task<SessionAppointment?> GetWithSeriesAsync(string appointmentId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.SessionAppointments
            .Include(a => a.SessionSeries)
            .ThenInclude(s => s.Connection)
            .AsSplitQuery()
            .FirstOrDefaultAsync(a => a.Id == appointmentId, cancellationToken);
    }

    public async Task<List<SessionAppointment>> GetBySessionSeriesAsync(string seriesId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.SessionAppointments
            .Where(a => a.SessionSeriesId == seriesId)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<SessionAppointment>> GetByConnectionAsync(string connectionId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.SessionAppointments
            .Where(a => a.SessionSeries.ConnectionId == connectionId)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<SessionAppointment>> GetUserAppointmentsAsync(string userId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.SessionAppointments
            .Include(a => a.SessionSeries)
                .ThenInclude(s => s.Connection)
            .AsSplitQuery()
            .AsNoTracking()
            .Where(a => a.OrganizerUserId == userId || a.ParticipantUserId == userId)
            .OrderByDescending(a => a.ScheduledDate)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<SessionAppointment>> GetUserAppointmentsWithPaginationAsync(
        string userId,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        return await _dbContext.SessionAppointments
            .Include(a => a.SessionSeries)
                .ThenInclude(s => s.Connection)
            .AsSplitQuery()
            .AsNoTracking()
            .Where(a => a.OrganizerUserId == userId || a.ParticipantUserId == userId)
            .OrderByDescending(a => a.ScheduledDate)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);
    }

    public async Task<int> GetUserAppointmentsCountAsync(string userId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.SessionAppointments
            .Where(a => a.OrganizerUserId == userId || a.ParticipantUserId == userId)
            .CountAsync(cancellationToken);
    }

    public async Task<SessionAppointment> CreateAsync(SessionAppointment appointment, CancellationToken cancellationToken = default)
    {
        await _dbContext.SessionAppointments.AddAsync(appointment, cancellationToken);
        return appointment;
    }

    public async Task<SessionAppointment> UpdateAsync(SessionAppointment appointment, CancellationToken cancellationToken = default)
    {
        _dbContext.SessionAppointments.Update(appointment);
        return await Task.FromResult(appointment);
    }

    public async Task DeleteAsync(string appointmentId, CancellationToken cancellationToken = default)
    {
        var appointment = await GetByIdAsync(appointmentId, cancellationToken);
        if (appointment != null)
        {
            _dbContext.SessionAppointments.Remove(appointment);
        }
    }

    public async Task DeleteBySeriesAsync(string seriesId, CancellationToken cancellationToken = default)
    {
        var appointments = await GetBySessionSeriesAsync(seriesId, cancellationToken);
        _dbContext.SessionAppointments.RemoveRange(appointments);
    }

    public async Task DeleteByConnectionAsync(string connectionId, CancellationToken cancellationToken = default)
    {
        var appointments = await GetByConnectionAsync(connectionId, cancellationToken);
        _dbContext.SessionAppointments.RemoveRange(appointments);
    }

    public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<(int total, int completed, int cancelled)> GetAppointmentStatisticsAsync(
        string userId,
        CancellationToken cancellationToken = default)
    {
        var appointments = await _dbContext.SessionAppointments
            .Where(a => a.OrganizerUserId == userId || a.ParticipantUserId == userId)
            .ToListAsync(cancellationToken);

        var total = appointments.Count;
        var completed = appointments.Count(a => a.Status == SessionAppointmentStatus.Completed);
        var cancelled = appointments.Count(a => a.Status == SessionAppointmentStatus.Cancelled);

        return (total, completed, cancelled);
    }

    public async Task<bool> HasRescheduleConflictAsync(
        string userId,
        DateTime newScheduledDate,
        int durationMinutes,
        string? excludeAppointmentId = null,
        CancellationToken cancellationToken = default)
    {
        var endTime = newScheduledDate.AddMinutes(durationMinutes);

        var hasConflict = await _dbContext.SessionAppointments
            .Where(a => (a.OrganizerUserId == userId || a.ParticipantUserId == userId) &&
                       a.Status != SessionAppointmentStatus.Cancelled &&
                       (excludeAppointmentId == null || a.Id != excludeAppointmentId) &&
                       ((a.ScheduledDate <= newScheduledDate && a.ScheduledDate.AddMinutes(a.DurationMinutes) > newScheduledDate) ||
                        (a.ScheduledDate < endTime && a.ScheduledDate.AddMinutes(a.DurationMinutes) >= endTime)))
            .AnyAsync(cancellationToken);

        return hasConflict;
    }
}
