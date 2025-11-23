using SkillService.Domain.Services;
using Infrastructure.Communication;
using Contracts.User.Responses;
using Microsoft.Extensions.Logging;

namespace SkillService.Infrastructure.HttpClients;


public class UserServiceClient : IUserServiceClient
{
    private readonly IServiceCommunicationManager _serviceCommunication;
    private readonly ILogger<UserServiceClient> _logger;

    public UserServiceClient(IServiceCommunicationManager serviceCommunication, ILogger<UserServiceClient> logger)
    {
        _serviceCommunication = serviceCommunication;
        _logger = logger;
    }

    public async Task<PublicUserProfileResponse?> GetUserProfileAsync(string userId, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogDebug("Getting user profile for {UserId}", userId);

            var response = await _serviceCommunication.GetAsync<PublicUserProfileResponse>(
                "userservice",
                $"api/users/public/{userId}",
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

    public async Task<bool> ValidateUserAsync(string userId, CancellationToken cancellationToken = default)
    {
        return await ValidateUserExistsAsync(userId, cancellationToken);
    }

    public async Task<string> GetUserNameAsync(string userId, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogDebug("Getting user name for {UserId}", userId);

            var userProfile = await GetUserProfileAsync(userId, cancellationToken);
            if (userProfile == null)
            {
                _logger.LogWarning("User {UserId} not found", userId);
                return "Unknown User";
            }

            var displayName = $"{userProfile.FirstName} {userProfile.LastName}".Trim();
            if (string.IsNullOrWhiteSpace(displayName))
            {
                return "Unknown User";
            }

            _logger.LogDebug("Retrieved user name for {UserId}: {DisplayName}", userId, displayName);
            return displayName;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user name for {UserId}", userId);
            return "Unknown User";
        }
    }
}
