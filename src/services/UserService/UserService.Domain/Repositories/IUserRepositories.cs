using UserService.Domain.Models;
using Contracts.User.Responses.Auth;
using Contracts.User.Responses;

namespace UserService.Domain.Repositories;

// Authentication Repository - handles login, registration, tokens
public interface IAuthRepository
{
    Task<RegisterResponse> RegisterUserWithTokens(string email, string password, string firstName, string lastName, string userName, CancellationToken cancellationToken = default);
    Task<LoginResponse> LoginUser(string email, string password, string? twoFactorCode = null, string? deviceId = null, string? deviceInfo = null, CancellationToken cancellationToken = default);
    Task<RefreshTokenResponse> RefreshUserToken(string accessToken, string refreshToken, CancellationToken cancellationToken = default);
    Task<bool> VerifyEmail(string email, string token, CancellationToken cancellationToken = default);
    Task ResendVerificationEmail(string email, CancellationToken cancellationToken = default);
    Task RequestPasswordReset(string email, CancellationToken cancellationToken = default);
    Task<bool> ResetPassword(string email, string token, string newPassword, CancellationToken cancellationToken = default);
}

// Two-Factor Authentication Repository - handles 2FA operations
public interface ITwoFactorRepository
{
    Task<(string secret, string qrCodeUri, string manualEntryKey)> GenerateTwoFactorSecret(string userId, CancellationToken cancellationToken = default);
    Task<bool> VerifyTwoFactorCode(string userId, string code, CancellationToken cancellationToken = default);
    Task<(bool hasSecret, bool isEnabled)> GetTwoFactorStatus(string userId, CancellationToken cancellationToken = default);
    Task UpdateTwoFactorSecret(string userId, string secret, CancellationToken cancellationToken = default);
    Task EnableTwoFactor(string userId, CancellationToken cancellationToken = default);
    Task DisableTwoFactor(string userId, string password, CancellationToken cancellationToken = default);
}

// User Profile Repository - handles user profile operations
public interface IUserProfileRepository
{
    Task<User?> GetUserProfile(string userId, CancellationToken cancellationToken = default);
    Task<User?> GetPublicUserProfile(string userId, string requestingUserId, CancellationToken cancellationToken = default);
    Task<User> UpdateUserProfile(string userId, string firstName, string lastName, string userName, string? bio, CancellationToken cancellationToken = default);
    Task<bool> ChangePassword(string userId, string currentPassword, string newPassword, CancellationToken cancellationToken = default);
    Task UploadAvatar(string userId, byte[] imageData, string fileName, string contentType, CancellationToken cancellationToken = default);
    Task DeleteAvatar(string userId, CancellationToken cancellationToken = default);
}

// User Management Repository - handles user CRUD and admin operations
public interface IUserRepository
{
    // User CRUD Operations
    Task<User?> GetUserById(string userId, CancellationToken cancellationToken = default);
    Task<User?> GetUserByEmail(string email, CancellationToken cancellationToken = default);
    Task<User?> GetUserByEmailWithRoles(string email, CancellationToken cancellationToken = default);
    Task<User?> GetUserWithRoles(string userId, CancellationToken cancellationToken = default);
    IQueryable<User> GetUsers(CancellationToken cancellationToken = default);
    Task<User> AddUser(User user, CancellationToken cancellationToken = default);
    Task<User> UpdateUser(User user, CancellationToken cancellationToken = default);

    // Email Availability & Validation
    Task<bool> IsEmailTaken(string email, CancellationToken cancellationToken = default);

    // User Roles Management
    Task<UserRole> AddUserRole(UserRole userRole, CancellationToken cancellationToken = default);
    Task<List<UserRole>> GetActiveUserRoles(string userId, CancellationToken cancellationToken = default);
    Task<bool> HasRole(string userId, string role, CancellationToken cancellationToken = default);
    Task<bool> IsAnyAdminExists(CancellationToken cancellationToken = default);
    Task AssignUserRole(string userId, string role, string assignedBy, CancellationToken cancellationToken = default);

    // Admin & Statistics Queries
    Task<(List<User> users, int totalCount)> GetAllUsersPagedAsync(int pageNumber, int pageSize, CancellationToken cancellationToken = default);
    Task<Dictionary<string, int>> GetUsersCountByStatus(CancellationToken cancellationToken = default);
    Task<Dictionary<string, int>> GetUsersCountByRole(CancellationToken cancellationToken = default);
    Task<(List<User> users, int totalCount)> SearchUsers(string? searchTerm, string? role, string? accountStatus, bool? emailVerified, DateTime? createdAfter, DateTime? createdBefore, int pageNumber, int pageSize, CancellationToken cancellationToken = default);
}

// User Skills Repository - handles favorite skills
public interface IUserSkillsRepository
{
    Task<bool> AddFavoriteSkill(string userId, string skillId, CancellationToken cancellationToken = default);
    Task<bool> RemoveFavoriteSkill(string userId, string skillId, CancellationToken cancellationToken = default);
    Task<List<string>> GetFavoriteSkills(string userId, CancellationToken cancellationToken = default);
}

// User Blocking Repository - handles user blocking operations
public interface IUserBlockingRepository
{
    Task<BlockedUser?> GetBlockedUser(string userId, string blockedUserId, CancellationToken cancellationToken = default);
    Task<BlockedUser> AddBlockedUser(BlockedUser blockedUser, CancellationToken cancellationToken = default);
    Task RemoveBlockedUser(BlockedUser blockedUser, CancellationToken cancellationToken = default);
    Task<bool> IsUserBlocked(string requestingUserId, string targetUserId, CancellationToken cancellationToken = default);
    Task<(List<BlockedUser> blockedUsers, int totalCount)> GetBlockedUsers(string userId, int pageNumber, int pageSize, CancellationToken cancellationToken = default);
}

// User Activity Repository - handles user activity logging
public interface IUserActivityRepository
{
    Task<(List<UserActivity> activities, int totalCount)> GetUserActivities(string userId, DateTime? fromDate, DateTime? toDate, string? activityType, int pageNumber, int pageSize, CancellationToken cancellationToken = default);
    Task<UserActivity> AddUserActivity(UserActivity activity, CancellationToken cancellationToken = default);
}
