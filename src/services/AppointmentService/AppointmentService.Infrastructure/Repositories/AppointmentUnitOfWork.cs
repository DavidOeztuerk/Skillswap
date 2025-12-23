using AppointmentService.Domain.Repositories;
using AppointmentService.Infrastructure.Data;

namespace AppointmentService.Infrastructure.Repositories;

/// <summary>
/// Unit of Work implementation for AppointmentService.
/// Coordinates multiple repositories and manages database persistence.
/// NOTE: Transaction methods removed - they conflict with NpgsqlRetryingExecutionStrategy.
/// Resilience is handled at the application level via MassTransit retry policies.
/// </summary>
public class AppointmentUnitOfWork : IAppointmentUnitOfWork
{
    private readonly AppointmentDbContext _dbContext;

    private ISessionAppointmentRepository? _sessionAppointments;
    private ISessionSeriesRepository? _sessionSeries;
    private ISessionRatingRepository? _sessionRatings;
    private ISessionPaymentRepository? _sessionPayments;
    private IConnectionRepository? _connections;

    public AppointmentUnitOfWork(AppointmentDbContext dbContext)
    {
        _dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
    }

    /// <summary>
    /// Gets or creates the SessionAppointment repository
    /// </summary>
    public ISessionAppointmentRepository SessionAppointments =>
        _sessionAppointments ??= new SessionAppointmentRepository(_dbContext);

    /// <summary>
    /// Gets or creates the SessionSeries repository
    /// </summary>
    public ISessionSeriesRepository SessionSeries =>
        _sessionSeries ??= new SessionSeriesRepository(_dbContext);

    /// <summary>
    /// Gets or creates the SessionRating repository
    /// </summary>
    public ISessionRatingRepository SessionRatings =>
        _sessionRatings ??= new SessionRatingRepository(_dbContext);

    /// <summary>
    /// Gets or creates the SessionPayment repository
    /// </summary>
    public ISessionPaymentRepository SessionPayments =>
        _sessionPayments ??= new SessionPaymentRepository(_dbContext);

    /// <summary>
    /// Gets or creates the Connection repository
    /// </summary>
    public IConnectionRepository Connections =>
        _connections ??= new ConnectionRepository(_dbContext);

    /// <summary>
    /// Saves all pending changes to the database.
    /// </summary>
    public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return await _dbContext.SaveChangesAsync(cancellationToken);
    }

    /// <summary>
    /// Disposes the DbContext resources.
    /// </summary>
    public async ValueTask DisposeAsync()
    {
        await _dbContext.DisposeAsync();
        GC.SuppressFinalize(this);
    }
}
