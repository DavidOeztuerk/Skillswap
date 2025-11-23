using AppointmentService.Domain.Entities;
using AppointmentService.Domain.Repositories;
using AppointmentService.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace AppointmentService.Infrastructure.Repositories;

public class SessionRatingRepository : ISessionRatingRepository
{
    private readonly AppointmentDbContext _dbContext;

    public SessionRatingRepository(AppointmentDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<SessionRating?> GetByIdAsync(string ratingId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.SessionRatings.FirstOrDefaultAsync(r => r.Id == ratingId, cancellationToken);
    }

    public async Task<SessionRating?> GetByAppointmentIdAsync(string appointmentId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.SessionRatings.FirstOrDefaultAsync(r => r.SessionAppointmentId == appointmentId, cancellationToken);
    }

    public async Task<List<SessionRating>> GetByRaterAsync(string raterId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.SessionRatings.Where(r => r.RaterId == raterId).ToListAsync(cancellationToken);
    }

    public async Task<List<SessionRating>> GetByRateeAsync(string rateeId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.SessionRatings.Where(r => r.RateeId == rateeId).ToListAsync(cancellationToken);
    }

    public async Task<SessionRating?> GetBySessionAndRaterAsync(string appointmentId, string raterId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.SessionRatings
            .FirstOrDefaultAsync(r => r.SessionAppointmentId == appointmentId && r.RaterId == raterId, cancellationToken);
    }

    public async Task<SessionRating> CreateAsync(SessionRating rating, CancellationToken cancellationToken = default)
    {
        await _dbContext.SessionRatings.AddAsync(rating, cancellationToken);
        return rating;
    }

    public async Task<SessionRating> UpdateAsync(SessionRating rating, CancellationToken cancellationToken = default)
    {
        _dbContext.SessionRatings.Update(rating);
        return await Task.FromResult(rating);
    }

    public async Task DeleteAsync(string ratingId, CancellationToken cancellationToken = default)
    {
        var rating = await GetByIdAsync(ratingId, cancellationToken);
        if (rating != null)
        {
            _dbContext.SessionRatings.Remove(rating);
        }
    }

    public async Task DeleteByAppointmentAsync(string appointmentId, CancellationToken cancellationToken = default)
    {
        var rating = await GetByAppointmentIdAsync(appointmentId, cancellationToken);
        if (rating != null)
        {
            _dbContext.SessionRatings.Remove(rating);
        }
    }

    public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return await _dbContext.SaveChangesAsync(cancellationToken);
    }
}
