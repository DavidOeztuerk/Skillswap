using Contracts.User.Responses;

namespace VideocallService.Domain.Services;

public interface IUserServiceClient
{
    Task<UserProfileResponse?> GetUserProfileAsync(string userId, CancellationToken cancellationToken = default);
    Task<bool> ValidateUserExistsAsync(string userId, CancellationToken cancellationToken = default);
    Task<string?> GetUserNameAsync(string userId, CancellationToken cancellationToken = default);
    Task<List<UserProfileResponse>> GetUserProfilesBatchAsync(List<string> userIds, CancellationToken cancellationToken = default);
}
