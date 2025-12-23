namespace AppointmentService.Domain.Repositories;

/// <summary>
/// Unit of Work pattern interface for AppointmentService.
/// Provides coordinated access to all repositories and manages database persistence.
/// NOTE: Transaction methods removed - they conflict with NpgsqlRetryingExecutionStrategy.
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
    /// Saves all changes across all repositories.
    /// </summary>
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
