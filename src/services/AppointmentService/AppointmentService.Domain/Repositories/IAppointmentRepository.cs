using AppointmentService.Domain.Entities;

namespace AppointmentService.Domain.Repositories;

/// <summary>
/// Repository interface for Appointment entities.
/// Defines all data access operations for appointments.
/// </summary>
public interface IAppointmentRepository
{
    // Query operations
    Task<Appointment?> GetByIdAsync(string appointmentId, CancellationToken cancellationToken = default);
    Task<List<Appointment>> GetUserAppointmentsAsync(string userId, CancellationToken cancellationToken = default);
    Task<List<Appointment>> GetUserAppointmentsWithPaginationAsync(
        string userId,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken = default);
    Task<int> GetUserAppointmentsCountAsync(string userId, CancellationToken cancellationToken = default);
    Task<List<Appointment>> GetAppointmentsBySkillIdAsync(string skillId, CancellationToken cancellationToken = default);
    Task<List<Appointment>> GetConflictingAppointmentsAsync(
        string userId,
        DateTime scheduledDate,
        int durationMinutes,
        string? excludeAppointmentId = null,
        CancellationToken cancellationToken = default);
    Task<Appointment?> GetDetailedAppointmentAsync(string appointmentId, CancellationToken cancellationToken = default);
    Task<(int total, int completed, int cancelled)> GetAppointmentStatisticsAsync(
        string userId,
        CancellationToken cancellationToken = default);
    Task<bool> HasSchedulingConflictAsync(
        string userId,
        DateTime scheduledDate,
        int durationMinutes,
        string? excludeAppointmentId = null,
        CancellationToken cancellationToken = default);
    Task<bool> HasRescheduleConflictAsync(
        string appointmentId,
        DateTime proposedDate,
        int proposedDuration,
        CancellationToken cancellationToken = default);

    // Create operations
    Task<Appointment> CreateAsync(Appointment appointment, CancellationToken cancellationToken = default);

    // Update operations
    Task<Appointment> UpdateAsync(Appointment appointment, CancellationToken cancellationToken = default);

    // Delete operations
    Task DeleteAsync(string appointmentId, CancellationToken cancellationToken = default);
    Task DeleteBySkillIdAsync(string skillId, CancellationToken cancellationToken = default);
    Task DeleteByUserIdAsync(string userId, CancellationToken cancellationToken = default);
    Task DeleteByMatchIdAsync(string matchId, CancellationToken cancellationToken = default);

    // Save changes
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
