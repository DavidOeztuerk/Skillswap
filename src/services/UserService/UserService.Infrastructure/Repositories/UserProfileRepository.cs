using Microsoft.EntityFrameworkCore;
using UserService.Domain.Models;
using UserService.Domain.Repositories;
using UserService.Domain.Enums;
using Core.Common.Exceptions;

namespace UserService.Infrastructure.Repositories;

public class UserProfileRepository(UserDbContext userDbContext) : IUserProfileRepository
{
    private readonly UserDbContext _dbContext = userDbContext;

    public async Task<User?> GetUserProfile(string userId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.Users
            .Where(u => u.Id == userId)
            .Include(u => u.UserRoles)                 // Lade UserRoles
                .ThenInclude(ur => ur.Role)            // und die zugehörige Role
            .AsNoTracking()
            .AsSplitQuery()                            // vermeidet Cartesische Explosionen
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<User?> GetPublicUserProfile(string userId, string requestingUserId, CancellationToken cancellationToken = default)
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

    public async Task<User> UpdateUserProfile(string userId, string firstName, string lastName, string userName, string? bio, CancellationToken cancellationToken = default)
    {
        var user = await _dbContext.Users.FindAsync([userId], cancellationToken);
        if (user == null)
            throw new ResourceNotFoundException("User", userId);

        if (!string.IsNullOrEmpty(userName) && userName != user.UserName)
        {
            var isUsernameTaken = await _dbContext.Users
                .AnyAsync(u => u.UserName == userName && u.Id != userId, cancellationToken);

            if (isUsernameTaken)
                throw new ResourceAlreadyExistsException("User", "UserName", userName);
        }

        user.FirstName = firstName;
        user.LastName = lastName;
        user.UserName = string.IsNullOrWhiteSpace(userName) ? user.UserName : userName;
        user.Bio = bio;
        user.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync(cancellationToken);
        return user;
    }

    public async Task<bool> ChangePassword(string userId, string currentPassword, string newPassword, CancellationToken cancellationToken = default)
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

    public async Task UploadAvatar(string userId, byte[] imageData, string fileName, string contentType, CancellationToken cancellationToken = default)
    {
        var user = await _dbContext.Users.FindAsync([userId], cancellationToken);
        if (user == null)
            throw new ResourceNotFoundException("User", userId);

        var avatarUrl = $"/avatars/{userId}/{fileName}";
        user.ProfilePictureUrl = avatarUrl;
        user.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAvatar(string userId, CancellationToken cancellationToken = default)
    {
        var user = await _dbContext.Users.FindAsync([userId], cancellationToken);
        if (user == null)
            throw new ResourceNotFoundException("User", userId);

        user.ProfilePictureUrl = null;
        user.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync(cancellationToken);
    }
}
