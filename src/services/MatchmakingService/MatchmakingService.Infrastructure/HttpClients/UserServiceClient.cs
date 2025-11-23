using Infrastructure.Communication;
using Contracts.User.Responses;
using MatchmakingService.Domain.Services;
using Microsoft.Extensions.Logging;

namespace MatchmakingService.Infrastructure.HttpClients;

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
                $"api/users/public/{userId}",
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
                $"api/users/public/{userId}",
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
                $"api/users/public/{userId}",
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

    public async Task<Dictionary<string, UserProfileBatch>> GetUserProfilesBatchAsync(IEnumerable<string> userIds, CancellationToken cancellationToken = default)
    {
        var result = new Dictionary<string, UserProfileBatch>();
        var distinctUserIds = userIds.Distinct().ToList();

        if (!distinctUserIds.Any())
        {
            return result;
        }

        _logger.LogInformation("Batch fetching {Count} user profiles", distinctUserIds.Count);

        // Fetch all user profiles concurrently with controlled parallelism
        var semaphore = new SemaphoreSlim(10); // Max 10 concurrent requests
        var tasks = distinctUserIds.Select(async userId =>
        {
            await semaphore.WaitAsync(cancellationToken);
            try
            {
                var response = await _serviceCommunication.GetAsync<PublicUserProfileResponse>(
                    "userservice",
                    $"api/users/public/{userId}",
                    cancellationToken);

                if (response != null)
                {
                    var userName = !string.IsNullOrWhiteSpace(response.UserName)
                        ? response.UserName
                        : $"{response.FirstName} {response.LastName}".Trim();

                    if (string.IsNullOrWhiteSpace(userName))
                    {
                        userName = "Unknown User";
                    }

                    return new UserProfileBatch(
                        UserId: userId,
                        UserName: userName,
                        FirstName: response.FirstName,
                        LastName: response.LastName,
                        AverageRating: response.AverageRating
                    );
                }

                _logger.LogWarning("Failed to fetch user profile for {UserId}", userId);
                return new UserProfileBatch(
                    UserId: userId,
                    UserName: "Unknown User",
                    FirstName: "Unknown",
                    LastName: "User",
                    AverageRating: 4.0
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching user profile for {UserId} in batch", userId);
                return new UserProfileBatch(
                    UserId: userId,
                    UserName: "Unknown User",
                    FirstName: "Unknown",
                    LastName: "User",
                    AverageRating: 4.0
                );
            }
            finally
            {
                semaphore.Release();
            }
        });

        var profiles = await Task.WhenAll(tasks);

        foreach (var profile in profiles)
        {
            result[profile.UserId] = profile;
        }

        _logger.LogInformation("Successfully batch fetched {Count} user profiles", result.Count);
        return result;
    }
}
