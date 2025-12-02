namespace AppointmentService.Domain.Repositories;

/// <summary>
/// Unit of Work pattern interface for AppointmentService.
/// Provides coordinated access to all repositories and manages transactions.
/// </summary>
public interface IAppointmentUnitOfWork : IAsyncDisposable
{
    /// <summary>
    /// Repository for SessionAppointment entities
    /// </summary>
    ISessionAppointmentRepository SessionAppointments { get; }

    /// <summary>
    /// Repository for SessionSeries entities
    /// </summary>
    ISessionSeriesRepository SessionSeries { get; }

    /// <summary>
    /// Repository for SessionRating entities
    /// </summary>
    ISessionRatingRepository SessionRatings { get; }

    /// <summary>
    /// Repository for SessionPayment entities
    /// </summary>
    ISessionPaymentRepository SessionPayments { get; }

    /// <summary>
    /// Repository for Connection entities
    /// </summary>
    IConnectionRepository Connections { get; }

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

    /// <summary>
    /// Executes an operation within a transaction with automatic commit/rollback.
    /// </summary>
    // Task<T> ExecuteInTransactionAsync<T>(Func<Task<T>> operation, CancellationToken cancellationToken = default);
}
