namespace VideocallService.Domain.Repositories;

/// <summary>
/// Unit of Work pattern interface for VideocallService.
/// Provides coordinated access to all repositories and manages transactions.
/// </summary>
public interface IVideocallUnitOfWork : IAsyncDisposable
{
    /// <summary>
    /// Repository for VideoCallSession entities
    /// </summary>
    IVideoCallSessionRepository VideoCallSessions { get; }

    /// <summary>
    /// Repository for CallParticipant entities
    /// </summary>
    ICallParticipantRepository CallParticipants { get; }

    /// <summary>
    /// Saves all changes across all repositories as a single transaction.
    /// </summary>
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Begins a database transaction.
    /// </summary>
    Task BeginTransactionAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Commits the current transaction.
    /// </summary>
    Task CommitTransactionAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Rolls back the current transaction.
    /// </summary>
    Task RollbackTransactionAsync(CancellationToken cancellationToken = default);
}
