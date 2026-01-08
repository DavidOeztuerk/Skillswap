using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using UserService.Domain.Models;
using UserService.Domain.Repositories;

namespace UserService.Infrastructure.Repositories;

public class UserReviewRepository(
    UserDbContext context,
    ILogger<UserReviewRepository> logger) : IUserReviewRepository
{
    private readonly UserDbContext _context = context;
    private readonly ILogger<UserReviewRepository> _logger = logger;

    public async Task<List<UserReview>> GetUserReviews(
        string revieweeId,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        _logger.LogDebug("Getting reviews for user {RevieweeId}, page {PageNumber}", revieweeId, pageNumber);

        return await _context.UserReviews
            .Where(r => r.RevieweeId == revieweeId)
            .OrderByDescending(r => r.CreatedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<UserReview>> GetUserReviewsWithReviewer(
        string revieweeId,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        _logger.LogDebug("Getting reviews with reviewer for user {RevieweeId}, page {PageNumber}", revieweeId, pageNumber);

        return await _context.UserReviews
            .Include(r => r.Reviewer)
            .Where(r => r.RevieweeId == revieweeId)
            .OrderByDescending(r => r.CreatedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);
    }

    public async Task<int> GetUserReviewCount(string revieweeId, CancellationToken cancellationToken = default)
    {
        return await _context.UserReviews
            .CountAsync(r => r.RevieweeId == revieweeId, cancellationToken);
    }

    public async Task<double> GetUserAverageRating(string revieweeId, CancellationToken cancellationToken = default)
    {
        var ratings = await _context.UserReviews
            .Where(r => r.RevieweeId == revieweeId)
            .Select(r => r.Rating)
            .ToListAsync(cancellationToken);

        if (ratings.Count == 0) return 0;

        return Math.Round(ratings.Average(), 1);
    }

    public async Task<UserReview?> GetReviewById(string reviewId, CancellationToken cancellationToken = default)
    {
        return await _context.UserReviews
            .FirstOrDefaultAsync(r => r.Id == reviewId, cancellationToken);
    }

    public async Task<UserReview?> GetReviewBySessionId(
        string reviewerId,
        string sessionId,
        CancellationToken cancellationToken = default)
    {
        return await _context.UserReviews
            .FirstOrDefaultAsync(r => r.ReviewerId == reviewerId && r.SessionId == sessionId, cancellationToken);
    }

    public async Task<UserReview> AddReview(UserReview review, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation(
            "Adding review from {ReviewerId} to {RevieweeId} with rating {Rating}",
            review.ReviewerId,
            review.RevieweeId,
            review.Rating);

        await _context.UserReviews.AddAsync(review, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        return review;
    }

    public async Task<UserReview> UpdateReview(UserReview review, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Updating review {ReviewId}", review.Id);

        _context.UserReviews.Update(review);
        await _context.SaveChangesAsync(cancellationToken);

        return review;
    }

    public async Task DeleteReview(string reviewId, string reviewerId, CancellationToken cancellationToken = default)
    {
        var review = await _context.UserReviews
            .FirstOrDefaultAsync(r => r.Id == reviewId && r.ReviewerId == reviewerId, cancellationToken);

        if (review != null)
        {
            _logger.LogInformation("Deleting review {ReviewId}", reviewId);
            _context.UserReviews.Remove(review);
            await _context.SaveChangesAsync(cancellationToken);
        }
    }
}
