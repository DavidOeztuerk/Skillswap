using AppointmentService.Domain.Entities;
using AppointmentService.Domain.Repositories;
using AppointmentService.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace AppointmentService.Infrastructure.Repositories;

public class ConnectionRepository : IConnectionRepository
{
    private readonly AppointmentDbContext _dbContext;

    public ConnectionRepository(AppointmentDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<Connection?> GetByIdAsync(string connectionId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.Connections.FirstOrDefaultAsync(c => c.Id == connectionId, cancellationToken);
    }

    public async Task<Connection?> GetWithSeriesAsync(string connectionId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.Connections
            .Include(c => c.SessionSeries)
            .ThenInclude(s => s.SessionAppointments)
            .FirstOrDefaultAsync(c => c.Id == connectionId, cancellationToken);
    }

    public async Task<List<Connection>> GetByUserAsync(string userId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.Connections
            .Where(c => c.RequesterId == userId || c.TargetUserId == userId)
            .ToListAsync(cancellationToken);
    }

    public async Task<Connection?> GetByMatchRequestIdAsync(string matchRequestId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.Connections
            .FirstOrDefaultAsync(c => c.MatchRequestId == matchRequestId, cancellationToken);
    }

    public async Task<Connection> CreateAsync(Connection connection, CancellationToken cancellationToken = default)
    {
        await _dbContext.Connections.AddAsync(connection, cancellationToken);
        return connection;
    }

    public async Task<Connection> UpdateAsync(Connection connection, CancellationToken cancellationToken = default)
    {
        _dbContext.Connections.Update(connection);
        return await Task.FromResult(connection);
    }

    public async Task DeleteAsync(string connectionId, CancellationToken cancellationToken = default)
    {
        var connection = await GetByIdAsync(connectionId, cancellationToken);
        if (connection != null)
        {
            _dbContext.Connections.Remove(connection);
        }
    }

    public async Task DeleteByUserAsync(string userId, CancellationToken cancellationToken = default)
    {
        var connections = await GetByUserAsync(userId, cancellationToken);
        _dbContext.Connections.RemoveRange(connections);
    }

    public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return await _dbContext.SaveChangesAsync(cancellationToken);
    }
}
