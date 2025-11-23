using AppointmentService.Domain.Entities;

namespace AppointmentService.Domain.Repositories;

/// <summary>
/// Repository interface for SessionSeries entities.
/// Manages a series of sessions between two users.
/// </summary>
public interface ISessionSeriesRepository
{
    // Query operations
    Task<SessionSeries?> GetByIdAsync(string seriesId, CancellationToken cancellationToken = default);
    Task<SessionSeries?> GetWithAppointmentsAsync(string seriesId, CancellationToken cancellationToken = default);
    Task<List<SessionSeries>> GetByConnectionAsync(string connectionId, CancellationToken cancellationToken = default);
    Task<List<SessionSeries>> GetByTeacherAsync(string teacherId, CancellationToken cancellationToken = default);
    Task<List<SessionSeries>> GetByLearnerAsync(string learnerId, CancellationToken cancellationToken = default);

    // Create operations
    Task<SessionSeries> CreateAsync(SessionSeries series, CancellationToken cancellationToken = default);

    // Update operations
    Task<SessionSeries> UpdateAsync(SessionSeries series, CancellationToken cancellationToken = default);

    // Delete operations
    Task DeleteAsync(string seriesId, CancellationToken cancellationToken = default);
    Task DeleteByConnectionAsync(string connectionId, CancellationToken cancellationToken = default);

    // Save changes
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
