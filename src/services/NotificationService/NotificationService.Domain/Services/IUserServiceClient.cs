using Contracts.User.Responses;

namespace NotificationService.Domain.Services;

/// <summary>
/// Client interface for communicating with User Service
/// </summary>
public interface IUserServiceClient
{
    Task<UserProfileResponse?> GetUserProfileAsync(string userId, CancellationToken cancellationToken = default);
    Task<bool> ValidateUserExistsAsync(string userId, CancellationToken cancellationToken = default);
    Task<List<UserContactInfoResponse>> GetUserContactInfoAsync(List<string> userIds, CancellationToken cancellationToken = default);
}

/// <summary>
/// User notification preferences response
/// </summary>
public class UserNotificationPreferencesResponse
{
    public string UserId { get; set; } = string.Empty;
    public bool EmailEnabled { get; set; } = true;
    public bool PushEnabled { get; set; } = true;
    public bool SmsEnabled { get; set; } = false;
    public List<string> DisabledNotificationTypes { get; set; } = new();
}

/// <summary>
/// User contact information response
/// </summary>
public class UserContactInfoResponse
{
    public string UserId { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? DisplayName { get; set; }
}
