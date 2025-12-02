using AppointmentService.Domain.Repositories;
using AppointmentService.Infrastructure.Data;
using Microsoft.EntityFrameworkCore.Storage;

namespace AppointmentService.Infrastructure.Repositories;

/// <summary>
/// Unit of Work implementation for AppointmentService.
/// Coordinates multiple repositories and manages transactions.
/// </summary>
public class AppointmentUnitOfWork : IAppointmentUnitOfWork
{
    private readonly AppointmentDbContext _dbContext;
    private IDbContextTransaction? _transaction;

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
    /// Begins a database transaction.
    /// </summary>
    public async Task BeginTransactionAsync(CancellationToken cancellationToken = default)
    {
        _transaction = await _dbContext.Database.BeginTransactionAsync(cancellationToken);
    }

    /// <summary>
    /// Commits the current transaction.
    /// </summary>
    public async Task CommitTransactionAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            await _dbContext.SaveChangesAsync(cancellationToken);
            if (_transaction != null)
            {
                await _transaction.CommitAsync(cancellationToken);
            }
        }
        catch
        {
            if (_transaction != null)
            {
                await _transaction.RollbackAsync(cancellationToken);
            }
            throw;
        }
        finally
        {
            if (_transaction != null)
            {
                await _transaction.DisposeAsync();
                _transaction = null;
            }
        }
    }

    /// <summary>
    /// Rolls back the current transaction.
    /// </summary>
    public async Task RollbackTransactionAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            if (_transaction != null)
            {
                await _transaction.RollbackAsync(cancellationToken);
            }
        }
        finally
        {
            if (_transaction != null)
            {
                await _transaction.DisposeAsync();
                _transaction = null;
            }
        }
    }

    // /// <summary>
    // /// Executes an operation within a transaction with automatic commit/rollback.
    // /// </summary>
    // public async Task<T> ExecuteInTransactionAsync<T>(Func<Task<T>> operation, CancellationToken cancellationToken = default)
    // {
    //     var strategy = _dbContext.Database.CreateExecutionStrategy();
    //     return await strategy.ExecuteAsync(async () =>
    //     {
    //         await BeginTransactionAsync(cancellationToken);
    //         try
    //         {
    //             var result = await operation();
    //             await CommitTransactionAsync(cancellationToken);
    //             return result;
    //         }
    //         catch
    //         {
    //             await RollbackTransactionAsync(cancellationToken);
    //             throw;
    //         }
    //     });
    // }

    /// <summary>
    /// Disposes the DbContext and transaction resources.
    /// </summary>
    public async ValueTask DisposeAsync()
    {
        if (_transaction != null)
        {
            await _transaction.DisposeAsync();
            _transaction = null;
        }

        await _dbContext.DisposeAsync();
        GC.SuppressFinalize(this);
    }
}
