using Microsoft.EntityFrameworkCore.Storage;
using MatchmakingService.Domain.Repositories;
using MatchmakingService.Infrastructure.Data;

namespace MatchmakingService.Infrastructure.Repositories;

/// <summary>
/// Unit of Work implementation for MatchmakingService.
/// Coordinates multiple repositories and manages transactions.
/// </summary>
public class MatchmakingUnitOfWork : IMatchmakingUnitOfWork
{
    private readonly MatchmakingDbContext _dbContext;
    private IDbContextTransaction? _transaction;

    private IMatchRepository? _matches;
    private IMatchRequestRepository? _matchRequests;

    public MatchmakingUnitOfWork(MatchmakingDbContext dbContext)
    {
        _dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
    }

    /// <summary>
    /// Gets or creates the Match repository
    /// </summary>
    public IMatchRepository Matches =>
        _matches ??= new MatchRepository(_dbContext);

    /// <summary>
    /// Gets or creates the MatchRequest repository
    /// </summary>
    public IMatchRequestRepository MatchRequests =>
        _matchRequests ??= new MatchRequestRepository(_dbContext);

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
