using Infrastructure.Communication;
using Microsoft.Extensions.Logging;
using Contracts.User.Responses;
using NotificationService.Domain.Services;

namespace NotificationService.Infrastructure.HttpClients;

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
            _logger.LogInformation("🔍 [UserServiceClient] Fetching user profile for {UserId}", userId);
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
            _logger.LogError(ex, "❌ [UserServiceClient] Failed to fetch user profile for {UserId}. Error: {ErrorMessage}", userId, ex.Message);
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

    public async Task<List<UserContactInfoResponse>> GetUserContactInfoAsync(List<string> userIds, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogDebug("Getting contact info for {Count} users", userIds.Count);

            var contactInfoList = new List<UserContactInfoResponse>();

            foreach (var userId in userIds)
            {
                var profile = await GetUserProfileAsync(userId, cancellationToken);
                if (profile != null)
                {
                    contactInfoList.Add(new UserContactInfoResponse
                    {
                        UserId = profile.UserId,
                        Email = profile.Email,
                        PhoneNumber = profile.PhoneNumber,
                        FirstName = profile.FirstName,
                        LastName = profile.LastName,
                        DisplayName = !string.IsNullOrEmpty(profile.UserName) ? profile.UserName : $"{profile.FirstName} {profile.LastName}"
                    });
                }
            }

            _logger.LogDebug("Successfully retrieved contact info for {Count} users", contactInfoList.Count);
            return contactInfoList;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching contact info for users");
            return new List<UserContactInfoResponse>();
        }
    }
}
