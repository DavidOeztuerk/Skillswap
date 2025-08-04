using Microsoft.EntityFrameworkCore;
using UserService.Domain.Models;
using UserService.Domain.Repositories;
using UserService.Domain.Enums;

namespace UserService.Infrastructure.Repositories;

public class UserProfileRepository(
    UserDbContext userDbContext) : IUserProfileRepository
{
    private readonly UserDbContext _dbContext = userDbContext;

    public async Task<User?> GetUserProfile(string userId, CancellationToken cancellationToken = default)
    {
        try
        {
            return await _dbContext.Users
                .Include(u => u.UserRoles)
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException($"Failed to get user profile for user {userId}", ex);
        }
    }

    public async Task<User?> GetPublicUserProfile(string userId, string requestingUserId, CancellationToken cancellationToken = default)
    {
        try
        {
            // Check if the requesting user is blocked by the target user
            var isBlocked = await _dbContext.BlockedUsers
                .AnyAsync(bu => bu.UserId == userId && bu.BlockedUserId == requestingUserId, cancellationToken);

            if (isBlocked)
            {
                return null; // Return null if blocked to protect privacy
            }

            return await _dbContext.Users
                .Include(u => u.UserRoles.Where(ur => ur.IsActive))
                .AsNoTracking()
                .Select(u => new User
                {
                    Id = u.Id,
                    UserName = u.UserName,
                    FirstName = u.FirstName,
                    LastName = u.LastName,
                    Bio = u.Bio,
                    ProfilcePictureUrl = u.ProfilcePictureUrl,
                    FavoriteSkillIds = u.FavoriteSkillIds,
                    CreatedAt = u.CreatedAt,
                    AccountStatus = u.AccountStatus,
                    UserRoles = u.UserRoles.Where(ur => ur.IsActive).ToList(),
                    // Exclude sensitive information like email, password, etc.
                })
                .FirstOrDefaultAsync(u => u.Id == userId && !u.IsDeleted && u.AccountStatus == AccountStatus.Active, cancellationToken);
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException($"Failed to get public user profile for user {userId}", ex);
        }
    }

    public async Task<User> UpdateUserProfile(string userId, string firstName, string lastName, string userName, string? bio, CancellationToken cancellationToken = default)
    {
        try
        {
            var user = await _dbContext.Users.FindAsync([userId], cancellationToken);
            if (user == null)
            {
                throw new InvalidOperationException($"User with ID {userId} not found");
            }

            // Check if username is already taken by another user
            if (!string.IsNullOrEmpty(userName) && userName != user.UserName)
            {
                var isUsernameTaken = await _dbContext.Users
                    .AnyAsync(u => u.UserName == userName && u.Id != userId, cancellationToken);

                if (isUsernameTaken)
                {
                    throw new InvalidOperationException("Username is already taken");
                }
            }

            user.FirstName = firstName;
            user.LastName = lastName;
            user.UserName = userName ?? user.UserName;
            user.Bio = bio;
            user.UpdatedAt = DateTime.UtcNow;

            await _dbContext.SaveChangesAsync(cancellationToken);
            return user;
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException($"Failed to update user profile for user {userId}", ex);
        }
    }

    public async Task<bool> ChangePassword(string userId, string currentPassword, string newPassword, CancellationToken cancellationToken = default)
    {
        try
        {
            var user = await _dbContext.Users.FindAsync([userId], cancellationToken);
            if (user == null)
            {
                return false;
            }

            // Verify current password
            if (!BCrypt.Net.BCrypt.Verify(currentPassword, user.PasswordHash))
            {
                return false;
            }

            // Update password
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword);
            user.UpdatedAt = DateTime.UtcNow;

            // Revoke all refresh tokens to force re-login
            var refreshTokens = await _dbContext.RefreshTokens
                .Where(rt => rt.UserId == userId && !rt.IsRevoked)
                .ToListAsync(cancellationToken);

            foreach (var token in refreshTokens)
            {
                token.IsRevoked = true;
                token.RevokedAt = DateTime.UtcNow;
                token.RevokedReason = "Password changed";
            }

            await _dbContext.SaveChangesAsync(cancellationToken);
            return true;
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException($"Failed to change password for user {userId}", ex);
        }
    }

    public async Task UploadAvatar(string userId, byte[] imageData, string fileName, string contentType, CancellationToken cancellationToken = default)
    {
        try
        {
            var user = await _dbContext.Users.FindAsync([userId], cancellationToken);
            if (user == null)
            {
                throw new InvalidOperationException($"User with ID {userId} not found");
            }

            // In a real implementation, you would upload to cloud storage (AWS S3, Azure Blob, etc.)
            // For now, we'll create a placeholder URL
            var avatarUrl = $"/avatars/{userId}/{fileName}";

            user.ProfilcePictureUrl = avatarUrl;
            user.UpdatedAt = DateTime.UtcNow;

            await _dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException($"Failed to upload avatar for user {userId}", ex);
        }
    }

    public async Task DeleteAvatar(string userId, CancellationToken cancellationToken = default)
    {
        try
        {
            var user = await _dbContext.Users.FindAsync([userId], cancellationToken);
            if (user == null)
            {
                throw new InvalidOperationException($"User with ID {userId} not found");
            }

            // In a real implementation, you would also delete the file from cloud storage
            user.ProfilcePictureUrl = null;
            user.UpdatedAt = DateTime.UtcNow;

            await _dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException($"Failed to delete avatar for user {userId}", ex);
        }
    }
}