using Infrastructure.Communication;
using Contracts.User.Responses;
using VideocallService.Domain.Services;
using Microsoft.Extensions.Logging;

namespace VideocallService.Infrastructure.HttpClients;

public class UserServiceClient : IUserServiceClient
{
    private readonly IServiceCommunicationManager _serviceCommunication;
    private readonly ILogger<UserServiceClient> _logger;

    public UserServiceClient(IServiceCommunicationManager serviceCommunication, ILogger<UserServiceClient> logger)
    {
        _serviceCommunication = serviceCommunication;
        _logger = logger;
    }

    public async Task<UserProfileResponse?> GetUserProfileAsync(string userId, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogDebug("Getting user profile for {UserId}", userId);

            // Use internal endpoint for M2M - requires Service role (M2M token)
            var response = await _serviceCommunication.GetAsync<UserProfileResponse>(
                "userservice",
                $"users/internal/{userId}",
                cancellationToken);

            if (response == null)
            {
                _logger.LogWarning("Failed to get user profile for {UserId} from UserService", userId);
                return null;
            }

            _logger.LogDebug("Successfully retrieved user profile for {UserId}", userId);
            return response;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching user profile for {UserId} from UserService", userId);
            return null;
        }
    }

    public async Task<bool> ValidateUserExistsAsync(string userId, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogDebug("Validating user existence for {UserId}", userId);

            var response = await GetUserProfileAsync(userId, cancellationToken);
            var exists = response != null;

            _logger.LogDebug("User {UserId} exists: {Exists}", userId, exists);
            return exists;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating user existence for {UserId}", userId);
            return false;
        }
    }

    public async Task<string?> GetUserNameAsync(string userId, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogDebug("Getting user name for {UserId}", userId);

            var userProfile = await GetUserProfileAsync(userId, cancellationToken);
            if (userProfile == null)
            {
                _logger.LogWarning("User {UserId} not found", userId);
                return null;
            }

            var displayName = $"{userProfile.FirstName} {userProfile.LastName}".Trim();

            _logger.LogDebug("Retrieved user name for {UserId}: {DisplayName}", userId, displayName);
            return displayName;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user name for {UserId}", userId);
            return null;
        }
    }

    public async Task<List<UserProfileResponse>> GetUserProfilesBatchAsync(List<string> userIds, CancellationToken cancellationToken = default)
    {
        var profiles = new List<UserProfileResponse>();

        try
        {
            _logger.LogDebug("Getting user profiles for {UserCount} users", userIds.Count);

            var tasks = userIds.Select(async userId =>
            {
                var profile = await GetUserProfileAsync(userId, cancellationToken);
                return profile;
            });

            var results = await Task.WhenAll(tasks);
            profiles.AddRange(results.Where(profile => profile != null)!);

            _logger.LogDebug("Successfully retrieved {ProfileCount} out of {RequestedCount} user profiles",
                profiles.Count, userIds.Count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user profiles batch from UserService");
        }

        return profiles;
    }
}
