using Contracts.User.Responses;

namespace AppointmentService.Domain.Services;

public interface IUserServiceClient
{
    Task<UserProfileResponse?> GetUserProfileAsync(string userId, CancellationToken cancellationToken = default);
    Task<bool> ValidateUserExistsAsync(string userId, CancellationToken cancellationToken = default);
    Task<string> GetUserNameAsync(string userId, CancellationToken cancellationToken = default);
    Task<UserProfileResponse?> GetUserByEmailAsync(string email, CancellationToken cancellationToken = default);

    /// <summary>
    /// Batch fetch user names by user IDs to avoid N+1 queries.
    /// </summary>
    Task<Dictionary<string, string>> GetUserNamesBatchAsync(IEnumerable<string> userIds, CancellationToken cancellationToken = default);
}
