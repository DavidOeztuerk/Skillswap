namespace MatchmakingService.Domain.Services;

/// <summary>
/// Service client interface for user-related operations.
/// </summary>
public interface IUserServiceClient
{
    Task<string> GetUserNameAsync(string userId, CancellationToken cancellationToken = default);
    Task<double> GetUserRatingAsync(string userId, CancellationToken cancellationToken = default);
    Task<bool> ValidateUserForMatchRequestAsync(string userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Batch fetch user profiles by user IDs to avoid N+1 queries.
    /// </summary>
    Task<Dictionary<string, UserProfileBatch>> GetUserProfilesBatchAsync(IEnumerable<string> userIds, CancellationToken cancellationToken = default);
}

/// <summary>
/// Lightweight user profile data for batch operations
/// </summary>
public record UserProfileBatch(
    string UserId,
    string UserName,
    string FirstName,
    string LastName,
    double AverageRating);
