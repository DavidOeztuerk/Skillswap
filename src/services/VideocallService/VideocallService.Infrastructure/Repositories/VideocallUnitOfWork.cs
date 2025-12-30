using Microsoft.EntityFrameworkCore.Storage;
using VideocallService.Domain.Repositories;
using VideocallService.Infrastructure.Data;

namespace VideocallService.Infrastructure.Repositories;

/// <summary>
/// Unit of Work implementation for VideocallService.
/// Coordinates multiple repositories and manages transactions.
/// </summary>
public class VideocallUnitOfWork : IVideocallUnitOfWork
{
    private readonly VideoCallDbContext _dbContext;
    private IDbContextTransaction? _transaction;

    private IVideoCallSessionRepository? _videoCallSessions;
    private ICallParticipantRepository? _callParticipants;
    private IE2EEAuditLogRepository? _e2eeAuditLogs;

    public VideocallUnitOfWork(VideoCallDbContext dbContext)
    {
        _dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
    }

    /// <summary>
    /// Gets or creates the VideoCallSession repository
    /// </summary>
    public IVideoCallSessionRepository VideoCallSessions =>
        _videoCallSessions ??= new VideoCallSessionRepository(_dbContext);

    /// <summary>
    /// Gets or creates the CallParticipant repository
    /// </summary>
    public ICallParticipantRepository CallParticipants =>
        _callParticipants ??= new CallParticipantRepository(_dbContext);

    /// <summary>
    /// Gets or creates the E2EE Audit Log repository
    /// </summary>
    public IE2EEAuditLogRepository E2EEAuditLogs =>
        _e2eeAuditLogs ??= new E2EEAuditLogRepository(_dbContext);

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
