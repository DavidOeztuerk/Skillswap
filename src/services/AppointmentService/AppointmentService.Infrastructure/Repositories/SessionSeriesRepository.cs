using AppointmentService.Domain.Entities;
using AppointmentService.Domain.Repositories;
using AppointmentService.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace AppointmentService.Infrastructure.Repositories;

public class SessionSeriesRepository : ISessionSeriesRepository
{
    private readonly AppointmentDbContext _dbContext;

    public SessionSeriesRepository(AppointmentDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<SessionSeries?> GetByIdAsync(string seriesId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.SessionSeries.FirstOrDefaultAsync(s => s.Id == seriesId, cancellationToken);
    }

    public async Task<SessionSeries?> GetWithAppointmentsAsync(string seriesId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.SessionSeries
            .Include(s => s.SessionAppointments)
            .Include(s => s.Connection)
            .FirstOrDefaultAsync(s => s.Id == seriesId, cancellationToken);
    }

    public async Task<List<SessionSeries>> GetByConnectionAsync(string connectionId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.SessionSeries
            .Where(s => s.ConnectionId == connectionId)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<SessionSeries>> GetByTeacherAsync(string teacherId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.SessionSeries
            .Where(s => s.TeacherUserId == teacherId)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<SessionSeries>> GetByLearnerAsync(string learnerId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.SessionSeries
            .Where(s => s.LearnerUserId == learnerId)
            .ToListAsync(cancellationToken);
    }

    public async Task<SessionSeries> CreateAsync(SessionSeries series, CancellationToken cancellationToken = default)
    {
        await _dbContext.SessionSeries.AddAsync(series, cancellationToken);
        return series;
    }

    public async Task<SessionSeries> UpdateAsync(SessionSeries series, CancellationToken cancellationToken = default)
    {
        _dbContext.SessionSeries.Update(series);
        return await Task.FromResult(series);
    }

    public async Task DeleteAsync(string seriesId, CancellationToken cancellationToken = default)
    {
        var series = await GetByIdAsync(seriesId, cancellationToken);
        if (series != null)
        {
            _dbContext.SessionSeries.Remove(series);
        }
    }

    public async Task DeleteByConnectionAsync(string connectionId, CancellationToken cancellationToken = default)
    {
        var seriesList = await GetByConnectionAsync(connectionId, cancellationToken);
        _dbContext.SessionSeries.RemoveRange(seriesList);
    }

    public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return await _dbContext.SaveChangesAsync(cancellationToken);
    }
}
