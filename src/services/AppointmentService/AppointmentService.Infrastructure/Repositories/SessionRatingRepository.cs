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

    public async Task<List<SessionRating>> GetUserReviewsWithPaginationAsync(
        string userId,
        int pageNumber,
        int pageSize,
        int? starFilter = null,
        CancellationToken cancellationToken = default)
    {
        var query = _dbContext.SessionRatings
            .Where(r => r.RateeId == userId && r.IsPublic && !r.IsFlagged);

        if (starFilter.HasValue)
        {
            query = query.Where(r => r.Rating == starFilter.Value);
        }

        return await query
            .OrderByDescending(r => r.CreatedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);
    }

    public async Task<int> GetUserReviewsCountAsync(
        string userId,
        int? starFilter = null,
        CancellationToken cancellationToken = default)
    {
        var query = _dbContext.SessionRatings
            .Where(r => r.RateeId == userId && r.IsPublic && !r.IsFlagged);

        if (starFilter.HasValue)
        {
            query = query.Where(r => r.Rating == starFilter.Value);
        }

        return await query.CountAsync(cancellationToken);
    }

    public async Task<Dictionary<int, int>> GetRatingDistributionAsync(
        string userId,
        CancellationToken cancellationToken = default)
    {
        var distribution = await _dbContext.SessionRatings
            .Where(r => r.RateeId == userId && r.IsPublic && !r.IsFlagged)
            .GroupBy(r => r.Rating)
            .Select(g => new { Rating = g.Key, Count = g.Count() })
            .ToListAsync(cancellationToken);

        // Initialize all ratings to 0, then populate
        var result = new Dictionary<int, int>
        {
            { 1, 0 }, { 2, 0 }, { 3, 0 }, { 4, 0 }, { 5, 0 }
        };

        foreach (var item in distribution)
        {
            result[item.Rating] = item.Count;
        }

        return result;
    }

    public async Task<(double? avgKnowledge, double? avgTeaching, double? avgCommunication, double? avgReliability)>
        GetSectionAveragesAsync(string userId, CancellationToken cancellationToken = default)
    {
        var ratings = await _dbContext.SessionRatings
            .Where(r => r.RateeId == userId && r.IsPublic && !r.IsFlagged)
            .Select(r => new
            {
                r.KnowledgeRating,
                r.TeachingRating,
                r.CommunicationRating,
                r.ReliabilityRating
            })
            .ToListAsync(cancellationToken);

        if (!ratings.Any())
        {
            return (null, null, null, null);
        }

        var avgKnowledge = ratings
            .Where(r => r.KnowledgeRating.HasValue)
            .Select(r => (double)r.KnowledgeRating!.Value)
            .DefaultIfEmpty()
            .Average();

        var avgTeaching = ratings
            .Where(r => r.TeachingRating.HasValue)
            .Select(r => (double)r.TeachingRating!.Value)
            .DefaultIfEmpty()
            .Average();

        var avgCommunication = ratings
            .Where(r => r.CommunicationRating.HasValue)
            .Select(r => (double)r.CommunicationRating!.Value)
            .DefaultIfEmpty()
            .Average();

        var avgReliability = ratings
            .Where(r => r.ReliabilityRating.HasValue)
            .Select(r => (double)r.ReliabilityRating!.Value)
            .DefaultIfEmpty()
            .Average();

        return (
            ratings.Any(r => r.KnowledgeRating.HasValue) ? avgKnowledge : null,
            ratings.Any(r => r.TeachingRating.HasValue) ? avgTeaching : null,
            ratings.Any(r => r.CommunicationRating.HasValue) ? avgCommunication : null,
            ratings.Any(r => r.ReliabilityRating.HasValue) ? avgReliability : null
        );
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
