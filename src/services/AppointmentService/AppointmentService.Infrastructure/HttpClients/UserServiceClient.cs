using Infrastructure.Communication;
using Contracts.User.Responses;
using Microsoft.Extensions.Logging;
using AppointmentService.Domain.Services;

namespace AppointmentService.Infrastructure.HttpClients;

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
        _logger.LogInformation("🔍 [UserServiceClient] Fetching user profile for {UserId}", userId);

        try
        {
            _logger.LogDebug("📡 [UserServiceClient] Sending GET request to UserService: /api/users/internal/{UserId}", userId);

            var response = await _serviceCommunication.GetAsync<UserProfileResponse>(
                "userservice",
                $"/api/users/internal/{userId}",
                cancellationToken);

            if (response == null)
            {
                _logger.LogWarning("⚠️ [UserServiceClient] UserService returned NULL for {UserId}", userId);
                return null;
            }

            _logger.LogInformation("✅ [UserServiceClient] User profile retrieved successfully for {UserId} - Email: {Email}, Name: {FirstName} {LastName}",
                userId, response.Email, response.FirstName, response.LastName);
            return response;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "❌ [UserServiceClient] Failed to fetch user profile for {UserId}. Error: {ErrorMessage}. StackTrace: {StackTrace}",
                userId, ex.Message, ex.StackTrace);
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

    public async Task<Dictionary<string, string>> GetUserNamesBatchAsync(IEnumerable<string> userIds, CancellationToken cancellationToken = default)
    {
        var result = new Dictionary<string, string>();
        var distinctUserIds = userIds.Distinct().ToList();

        if (!distinctUserIds.Any())
        {
            return result;
        }

        _logger.LogInformation("Batch fetching {Count} user names", distinctUserIds.Count);

        // Fetch all user profiles concurrently with controlled parallelism
        var semaphore = new SemaphoreSlim(10); // Max 10 concurrent requests
        var tasks = distinctUserIds.Select(async userId =>
        {
            await semaphore.WaitAsync(cancellationToken);
            try
            {
                var response = await _serviceCommunication.GetAsync<UserProfileResponse>(
                    "userservice",
                    $"/api/users/internal/{userId}",
                    cancellationToken);

                if (response != null)
                {
                    var fullName = $"{response.FirstName} {response.LastName}".Trim();
                    var userName = !string.IsNullOrWhiteSpace(fullName)
                        ? fullName
                        : $"User {userId.Substring(0, Math.Min(8, userId.Length))}...";

                    return new KeyValuePair<string, string>(userId, userName);
                }

                _logger.LogWarning("Failed to fetch user name for {UserId}", userId);
                return new KeyValuePair<string, string>(userId, $"User {userId.Substring(0, Math.Min(8, userId.Length))}...");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching user name for {UserId} in batch", userId);
                return new KeyValuePair<string, string>(userId, $"User {userId.Substring(0, Math.Min(8, userId.Length))}...");
            }
            finally
            {
                semaphore.Release();
            }
        });

        var userNames = await Task.WhenAll(tasks);

        foreach (var kvp in userNames)
        {
            result[kvp.Key] = kvp.Value;
        }

        _logger.LogInformation("Successfully batch fetched {Count} user names", result.Count);
        return result;
    }
}
