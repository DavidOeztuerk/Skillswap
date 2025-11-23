using AppointmentService.Domain.Entities;
using AppointmentService.Domain.Repositories;
using AppointmentService.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace AppointmentService.Infrastructure.Repositories;

/// <summary>
/// Repository implementation for Appointment entities.
/// Handles all data access operations for appointments.
/// </summary>
public class AppointmentRepository : IAppointmentRepository
{
    private readonly AppointmentDbContext _dbContext;

    public AppointmentRepository(AppointmentDbContext dbContext)
    {
        _dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
    }

    public async Task<Appointment?> GetByIdAsync(string appointmentId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.Appointments
            .FirstOrDefaultAsync(a => a.Id == appointmentId, cancellationToken);
    }

    public async Task<List<Appointment>> GetUserAppointmentsAsync(string userId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.Appointments
            .Where(a => a.OrganizerUserId == userId || a.ParticipantUserId == userId)
            .OrderByDescending(a => a.ScheduledDate)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<Appointment>> GetUserAppointmentsWithPaginationAsync(
        string userId,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        var skip = (pageNumber - 1) * pageSize;

        return await _dbContext.Appointments
            .Where(a => a.OrganizerUserId == userId || a.ParticipantUserId == userId)
            .OrderByDescending(a => a.ScheduledDate)
            .Skip(skip)
            .Take(pageSize)
            .ToListAsync(cancellationToken);
    }

    public async Task<int> GetUserAppointmentsCountAsync(string userId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.Appointments
            .CountAsync(a => a.OrganizerUserId == userId || a.ParticipantUserId == userId, cancellationToken);
    }

    public async Task<List<Appointment>> GetAppointmentsBySkillIdAsync(string skillId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.Appointments
            .Where(a => a.SkillId == skillId)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<Appointment>> GetConflictingAppointmentsAsync(
        string userId,
        DateTime scheduledDate,
        int durationMinutes,
        string? excludeAppointmentId = null,
        CancellationToken cancellationToken = default)
    {
        var endDate = scheduledDate.AddMinutes(durationMinutes);

        var query = _dbContext.Appointments
            .Where(a => (a.OrganizerUserId == userId || a.ParticipantUserId == userId)
                && a.Status != "Cancelled"
                && a.ScheduledDate < endDate
                && a.ScheduledDate.AddMinutes(a.DurationMinutes) > scheduledDate);

        if (!string.IsNullOrEmpty(excludeAppointmentId))
        {
            query = query.Where(a => a.Id != excludeAppointmentId);
        }

        return await query.ToListAsync(cancellationToken);
    }

    public async Task<Appointment?> GetDetailedAppointmentAsync(string appointmentId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.Appointments
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.Id == appointmentId, cancellationToken);
    }

    public async Task<(int total, int completed, int cancelled)> GetAppointmentStatisticsAsync(
        string userId,
        CancellationToken cancellationToken = default)
    {
        var appointments = await _dbContext.Appointments
            .Where(a => a.OrganizerUserId == userId || a.ParticipantUserId == userId)
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        var total = appointments.Count;
        var completed = appointments.Count(a => a.Status == "Completed");
        var cancelled = appointments.Count(a => a.Status == "Cancelled");

        return (total, completed, cancelled);
    }

    public async Task<Appointment> CreateAsync(Appointment appointment, CancellationToken cancellationToken = default)
    {
        await _dbContext.Appointments.AddAsync(appointment, cancellationToken);
        return appointment;
    }

    public async Task<Appointment> UpdateAsync(Appointment appointment, CancellationToken cancellationToken = default)
    {
        _dbContext.Appointments.Update(appointment);
        return await Task.FromResult(appointment);
    }

    public async Task DeleteAsync(string appointmentId, CancellationToken cancellationToken = default)
    {
        var appointment = await GetByIdAsync(appointmentId, cancellationToken);
        if (appointment != null)
        {
            _dbContext.Appointments.Remove(appointment);
        }
    }

    public async Task DeleteBySkillIdAsync(string skillId, CancellationToken cancellationToken = default)
    {
        var appointments = await GetAppointmentsBySkillIdAsync(skillId, cancellationToken);
        _dbContext.Appointments.RemoveRange(appointments);
    }

    public async Task DeleteByUserIdAsync(string userId, CancellationToken cancellationToken = default)
    {
        var appointments = await GetUserAppointmentsAsync(userId, cancellationToken);
        _dbContext.Appointments.RemoveRange(appointments);
    }

    public async Task DeleteByMatchIdAsync(string matchId, CancellationToken cancellationToken = default)
    {
        // Delete appointments associated with this match
        var appointments = await _dbContext.Appointments
            .Where(a => a.MatchId == matchId)
            .ToListAsync(cancellationToken);
        _dbContext.Appointments.RemoveRange(appointments);
    }

    public async Task<bool> HasSchedulingConflictAsync(
        string userId,
        DateTime scheduledDate,
        int durationMinutes,
        string? excludeAppointmentId = null,
        CancellationToken cancellationToken = default)
    {
        var endDate = scheduledDate.AddMinutes(durationMinutes);

        var query = _dbContext.Appointments
            .Where(a => (a.OrganizerUserId == userId || a.ParticipantUserId == userId)
                && a.Status != "Cancelled"
                && a.ScheduledDate < endDate
                && a.ScheduledDate.AddMinutes(a.DurationMinutes) > scheduledDate);

        if (!string.IsNullOrEmpty(excludeAppointmentId))
        {
            query = query.Where(a => a.Id != excludeAppointmentId);
        }

        return await query.AnyAsync(cancellationToken);
    }

    public async Task<bool> HasRescheduleConflictAsync(
        string appointmentId,
        DateTime proposedDate,
        int proposedDuration,
        CancellationToken cancellationToken = default)
    {
        var appointment = await GetByIdAsync(appointmentId, cancellationToken);
        if (appointment == null)
            return false;

        return await HasSchedulingConflictAsync(
            appointment.OrganizerUserId,
            proposedDate,
            proposedDuration,
            appointmentId,
            cancellationToken);
    }

    public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return await _dbContext.SaveChangesAsync(cancellationToken);
    }
}
