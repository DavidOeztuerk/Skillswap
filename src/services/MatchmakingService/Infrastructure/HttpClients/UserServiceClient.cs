using Infrastructure.Communication;
using Contracts.User.Responses;

namespace MatchmakingService.Infrastructure.HttpClients;

public interface IUserServiceClient
{
    Task<string> GetUserNameAsync(string userId, CancellationToken cancellationToken = default);
    Task<double> GetUserRatingAsync(string userId, CancellationToken cancellationToken = default);
    Task<bool> ValidateUserForMatchRequestAsync(string userId, CancellationToken cancellationToken = default);
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

    public async Task<string> GetUserNameAsync(string userId, CancellationToken cancellationToken = default)
    {
        try
        {
            var response = await _serviceCommunication.GetAsync<PublicUserProfileResponse>(
                "userservice",
                $"users/public/{userId}",
                cancellationToken);

            if (response == null)
            {
                _logger.LogWarning("Failed to get user {UserId} from UserService", userId);
                return "Unknown User";
            }

            if (!string.IsNullOrWhiteSpace(response.UserName))
            {
                return response.UserName;
            }

            var fullName = $"{response.FirstName} {response.LastName}".Trim();
            return !string.IsNullOrWhiteSpace(fullName) ? fullName : "Unknown User";
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching user {UserId} from UserService", userId);
            return "Unknown User";
        }
    }

    public async Task<double> GetUserRatingAsync(string userId, CancellationToken cancellationToken = default)
    {
        try
        {
            var response = await _serviceCommunication.GetAsync<PublicUserProfileResponse>(
                "userservice",
                $"users/public/{userId}",
                cancellationToken);

            if (response == null)
            {
                _logger.LogWarning("Failed to get user rating for {UserId} from UserService", userId);
                return 4.0;
            }

            return response.AverageRating;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching user rating for {UserId} from UserService", userId);
            return 4.0;
        }
    }

    public async Task<bool> ValidateUserForMatchRequestAsync(string userId, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogDebug("Validating user {UserId} for match request", userId);

            var response = await _serviceCommunication.GetAsync<PublicUserProfileResponse>(
                "userservice",
                $"users/public/{userId}",
                cancellationToken);

            // If we get a response, user is verified and active
            if (response != null)
            {
                _logger.LogDebug("User {UserId} is verified and can create match requests", userId);
                return true;
            }

            // If null response (404), user is not verified or doesn't exist
            _logger.LogWarning("User {UserId} is not verified or doesn't exist - cannot create match requests", userId);
            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating user {UserId} for match request", userId);
            return false;
        }
    }
}
