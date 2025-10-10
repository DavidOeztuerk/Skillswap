using Infrastructure.Communication;
using Contracts.User.Responses;

namespace AppointmentService.Infrastructure.HttpClients;

public interface IUserServiceClient
{
    Task<UserProfileResponse?> GetUserProfileAsync(string userId, CancellationToken cancellationToken = default);
    Task<bool> ValidateUserExistsAsync(string userId, CancellationToken cancellationToken = default);
    Task<string> GetUserNameAsync(string userId, CancellationToken cancellationToken = default);
    Task<UserProfileResponse?> GetUserByEmailAsync(string email, CancellationToken cancellationToken = default);
}

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

    public async Task<string> GetUserNameAsync(string userId, CancellationToken cancellationToken = default)
    {
        try
        {
            var response = await GetUserProfileAsync(userId, cancellationToken);

            if (response == null)
            {
                _logger.LogWarning("Failed to get user name for {UserId} from UserService", userId);
                return $"User {userId.Substring(0, 8)}...";
            }

            var fullName = $"{response.FirstName} {response.LastName}".Trim();
            return string.IsNullOrEmpty(fullName) ? $"User {userId.Substring(0, 8)}..." : fullName;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching user name for {UserId} from UserService", userId);
            return $"User {userId.Substring(0, 8)}...";
        }
    }

    public async Task<UserProfileResponse?> GetUserByEmailAsync(string email, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogDebug("Getting user by email {Email}", email);

            // If a search endpoint exists via gateway, prefer it. For now, return null as placeholder.
            var response = await Task.FromResult<UserProfileResponse?>(null);

            if (response == null)
            {
                _logger.LogWarning("Failed to get user by email {Email} from UserService", email);
                return null;
            }

            _logger.LogDebug("Successfully retrieved user by email {Email}", email);
            return response;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching user by email {Email} from UserService", email);
            return null;
        }
    }
}
