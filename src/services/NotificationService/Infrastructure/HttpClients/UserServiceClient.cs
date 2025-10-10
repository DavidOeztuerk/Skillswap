using Infrastructure.Communication;
using Contracts.User.Responses;

namespace NotificationService.Infrastructure.HttpClients;

public interface IUserServiceClient
{
    Task<UserProfileResponse?> GetUserProfileAsync(string userId, CancellationToken cancellationToken = default);
    Task<bool> ValidateUserExistsAsync(string userId, CancellationToken cancellationToken = default);
    Task<UserNotificationPreferencesResponse?> GetUserNotificationPreferencesAsync(string userId, CancellationToken cancellationToken = default);
    Task<List<UserContactInfoResponse>> GetUserContactInfoAsync(List<string> userIds, CancellationToken cancellationToken = default);
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
                $"users/profile/{userId}",
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

    public async Task<UserNotificationPreferencesResponse?> GetUserNotificationPreferencesAsync(string userId, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogDebug("Getting notification preferences for user {UserId}", userId);

            // No dedicated endpoint available; fallback to defaults
            var response = await Task.FromResult<UserNotificationPreferencesResponse?>(null);

            if (response == null)
            {
                _logger.LogWarning("Failed to get notification preferences for {UserId} from UserService", userId);
                return new UserNotificationPreferencesResponse
                {
                    UserId = userId,
                    EmailEnabled = true,
                    PushEnabled = true,
                    SmsEnabled = false
                };
            }

            _logger.LogDebug("Successfully retrieved notification preferences for {UserId}", userId);
            return response;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching notification preferences for {UserId} from UserService", userId);
            return new UserNotificationPreferencesResponse
            {
                UserId = userId,
                EmailEnabled = true,
                PushEnabled = true,
                SmsEnabled = false
            };
        }
    }

    public async Task<List<UserContactInfoResponse>> GetUserContactInfoAsync(List<string> userIds, CancellationToken cancellationToken = default)
    {
        var contactInfoList = new List<UserContactInfoResponse>();

        try
        {
            _logger.LogDebug("Getting contact info for {UserCount} users", userIds.Count);

            var tasks = userIds.Select(async userId =>
            {
                try
                {
                    var profile = await GetUserProfileAsync(userId, cancellationToken);
                    if (profile != null)
                    {
                        return new UserContactInfoResponse
                        {
                            UserId = userId,
                            Email = profile.Email,
                            PhoneNumber = profile.PhoneNumber,
                            FirstName = profile.FirstName,
                            LastName = profile.LastName,
                            DisplayName = $"{profile.FirstName} {profile.LastName}".Trim()
                        };
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to get contact info for user {UserId}", userId);
                }
                return null;
            });

            var results = await Task.WhenAll(tasks);
            contactInfoList.AddRange(results.Where(info => info != null)!);

            _logger.LogDebug("Successfully retrieved contact info for {ContactCount} out of {RequestedCount} users",
                contactInfoList.Count, userIds.Count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user contact info from UserService");
        }

        return contactInfoList;
    }
}

public class UserNotificationPreferencesResponse
{
    public string UserId { get; set; } = string.Empty;
    public bool EmailEnabled { get; set; } = true;
    public bool PushEnabled { get; set; } = true;
    public bool SmsEnabled { get; set; } = false;
    public List<string> DisabledNotificationTypes { get; set; } = new();
}

public class UserContactInfoResponse
{
    public string UserId { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? DisplayName { get; set; }
}
