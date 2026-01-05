using Contracts.User.Responses;

namespace SkillService.Domain.Services;

public interface IUserServiceClient
{
    Task<string> GetUserNameAsync(string userId, CancellationToken cancellationToken = default);
    Task<bool> ValidateUserAsync(string userId, CancellationToken cancellationToken = default);
    Task<PublicUserProfileResponse?> GetUserProfileAsync(string userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets user profiles for multiple users in parallel
    /// </summary>
    Task<Dictionary<string, PublicUserProfileResponse>> GetUserProfilesAsync(IEnumerable<string> userIds, CancellationToken cancellationToken = default);
}
