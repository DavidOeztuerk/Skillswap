namespace MatchmakingService.Domain.Repositories;

/// <summary>
/// Unit of Work pattern interface for MatchmakingService.
/// Provides coordinated access to all repositories and manages transactions.
/// </summary>
public interface IMatchmakingUnitOfWork : IAsyncDisposable
{
    /// <summary>
    /// Repository for Match entities
    /// </summary>
    IMatchRepository Matches { get; }

    /// <summary>
    /// Repository for MatchRequest entities
    /// </summary>
    IMatchRequestRepository MatchRequests { get; }

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
