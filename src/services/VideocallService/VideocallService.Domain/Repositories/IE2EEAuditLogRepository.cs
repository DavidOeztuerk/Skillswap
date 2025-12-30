using VideocallService.Domain.Entities;

namespace VideocallService.Domain.Repositories;

/// <summary>
/// Repository interface for E2EE Audit Log entities
/// </summary>
public interface IE2EEAuditLogRepository
{
    /// <summary>
    /// Adds a new audit log entry
    /// </summary>
    Task<E2EEAuditLog> AddAsync(E2EEAuditLog auditLog, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets audit logs by session ID
    /// </summary>
    Task<IReadOnlyList<E2EEAuditLog>> GetBySessionIdAsync(string sessionId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets audit logs by room ID
    /// </summary>
    Task<IReadOnlyList<E2EEAuditLog>> GetByRoomIdAsync(string roomId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets audit logs by user ID (as sender)
    /// </summary>
    Task<IReadOnlyList<E2EEAuditLog>> GetByUserIdAsync(string userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets failed operations for security analysis
    /// </summary>
    Task<IReadOnlyList<E2EEAuditLog>> GetFailedOperationsAsync(
        DateTime from,
        DateTime to,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets rate-limited operations for analysis
    /// </summary>
    Task<IReadOnlyList<E2EEAuditLog>> GetRateLimitedOperationsAsync(
        DateTime from,
        DateTime to,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Counts operations by user in a time window (for reporting)
    /// </summary>
    Task<int> CountByUserInWindowAsync(
        string userId,
        DateTime from,
        DateTime to,
        CancellationToken cancellationToken = default);
}
