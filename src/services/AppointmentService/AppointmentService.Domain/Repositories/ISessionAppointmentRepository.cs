using AppointmentService.Domain.Entities;

namespace AppointmentService.Domain.Repositories;

/// <summary>
/// Repository interface for SessionAppointment entities.
/// Manages session-specific appointment operations.
/// </summary>
public interface ISessionAppointmentRepository
{
    // Query operations
    Task<SessionAppointment?> GetByIdAsync(string appointmentId, CancellationToken cancellationToken = default);
    Task<SessionAppointment?> GetWithSeriesAsync(string appointmentId, CancellationToken cancellationToken = default);
    Task<List<SessionAppointment>> GetBySessionSeriesAsync(string seriesId, CancellationToken cancellationToken = default);
    Task<List<SessionAppointment>> GetByConnectionAsync(string connectionId, CancellationToken cancellationToken = default);

    // User appointment queries
    Task<List<SessionAppointment>> GetUserAppointmentsAsync(string userId, CancellationToken cancellationToken = default);
    Task<List<SessionAppointment>> GetUserAppointmentsWithPaginationAsync(
        string userId,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken = default);
    Task<int> GetUserAppointmentsCountAsync(string userId, CancellationToken cancellationToken = default);

    // Create operations
    Task<SessionAppointment> CreateAsync(SessionAppointment appointment, CancellationToken cancellationToken = default);

    // Update operations
    Task<SessionAppointment> UpdateAsync(SessionAppointment appointment, CancellationToken cancellationToken = default);

    // Delete operations
    Task DeleteAsync(string appointmentId, CancellationToken cancellationToken = default);

    // Batch operations
    Task DeleteBySeriesAsync(string seriesId, CancellationToken cancellationToken = default);
    Task DeleteByConnectionAsync(string connectionId, CancellationToken cancellationToken = default);

    // Save changes
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);

    // Statistics
    Task<(int total, int completed, int cancelled)> GetAppointmentStatisticsAsync(
        string userId,
        CancellationToken cancellationToken = default);

    // Validation
    Task<bool> HasRescheduleConflictAsync(
        string userId,
        DateTime newScheduledDate,
        int durationMinutes,
        string? excludeAppointmentId = null,
        CancellationToken cancellationToken = default);
}
