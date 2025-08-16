using Microsoft.EntityFrameworkCore;
using UserService.Domain.Models;
using UserService.Domain.Repositories;
using UserService.Domain.Enums;

namespace UserService.Infrastructure.Repositories;

public class UserProfileRepository(UserDbContext userDbContext) : IUserProfileRepository
{
    private readonly UserDbContext _dbContext = userDbContext;

    public async Task<User?> GetUserProfile(string userId, CancellationToken cancellationToken = default)
    {
        try
        {
            return await _dbContext.Users
                .Where(u => u.Id == userId)
                .Include(u => u.UserRoles)                 // Lade UserRoles
                    .ThenInclude(ur => ur.Role)            // und die zugehörige Role
                .AsNoTracking()
                .AsSplitQuery()                            // vermeidet Cartesische Explosionen
                .FirstOrDefaultAsync(cancellationToken);
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
            var isBlocked = await _dbContext.BlockedUsers
                .AnyAsync(bu => bu.UserId == userId && bu.BlockedUserId == requestingUserId, cancellationToken);

            if (isBlocked)
                return null;

            // WICHTIG: Keine Projection auf neue User-Entität + Include mischen.
            // Entweder sauber projizieren ODER volle Entität laden. Wir laden die Entität
            // inkl. gefilterter aktiver Rollen und deren Role-Navigation.
            return await _dbContext.Users
                .Where(u => u.Id == userId && !u.IsDeleted && u.AccountStatus == AccountStatus.Active)
                .Include(u => u.UserRoles.Where(ur => ur.IsActive))
                    .ThenInclude(ur => ur.Role)
                .AsNoTracking()
                .AsSplitQuery()
                .FirstOrDefaultAsync(cancellationToken);
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
                throw new InvalidOperationException($"User with ID {userId} not found");

            if (!string.IsNullOrEmpty(userName) && userName != user.UserName)
            {
                var isUsernameTaken = await _dbContext.Users
                    .AnyAsync(u => u.UserName == userName && u.Id != userId, cancellationToken);

                if (isUsernameTaken)
                    throw new InvalidOperationException("Username is already taken");
            }

            user.FirstName = firstName;
            user.LastName = lastName;
            user.UserName = string.IsNullOrWhiteSpace(userName) ? user.UserName : userName;
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
                return false;

            if (!BCrypt.Net.BCrypt.Verify(currentPassword, user.PasswordHash))
                return false;

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword);
            user.UpdatedAt = DateTime.UtcNow;

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
                throw new InvalidOperationException($"User with ID {userId} not found");

            var avatarUrl = $"/avatars/{userId}/{fileName}";
            user.ProfilePictureUrl = avatarUrl;
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
                throw new InvalidOperationException($"User with ID {userId} not found");

            user.ProfilePictureUrl = null;
            user.UpdatedAt = DateTime.UtcNow;

            await _dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException($"Failed to delete avatar for user {userId}", ex);
        }
    }
}
