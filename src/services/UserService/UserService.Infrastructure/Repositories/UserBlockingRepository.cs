using Microsoft.EntityFrameworkCore;
using UserService.Domain.Models;
using UserService.Domain.Repositories;

namespace UserService.Infrastructure.Repositories;

public class UserBlockingRepository(
    UserDbContext userDbContext) : IUserBlockingRepository
{
    private readonly UserDbContext _dbContext = userDbContext;

    public async Task<BlockedUser?> GetBlockedUser(string userId, string blockedUserId, CancellationToken cancellationToken = default)
    {
        try
        {
            return await _dbContext.BlockedUsers
                .AsNoTracking()
                .FirstOrDefaultAsync(bu => bu.UserId == userId && bu.BlockedUserId == blockedUserId && !bu.IsDeleted, 
                    cancellationToken);
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException($"Failed to get blocked user {blockedUserId} for user {userId}", ex);
        }
    }

    public async Task<BlockedUser> AddBlockedUser(BlockedUser blockedUser, CancellationToken cancellationToken = default)
    {
        try
        {
            // Check if the block relationship already exists
            var existingBlock = await _dbContext.BlockedUsers
                .FirstOrDefaultAsync(bu => bu.UserId == blockedUser.UserId && 
                                         bu.BlockedUserId == blockedUser.BlockedUserId && 
                                         !bu.IsDeleted, cancellationToken);

            if (existingBlock != null)
            {
                throw new InvalidOperationException("User is already blocked");
            }

            // Prevent self-blocking
            if (blockedUser.UserId == blockedUser.BlockedUserId)
            {
                throw new InvalidOperationException("Users cannot block themselves");
            }

            _dbContext.BlockedUsers.Add(blockedUser);
            await _dbContext.SaveChangesAsync(cancellationToken);
            return blockedUser;
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException($"Failed to add blocked user {blockedUser.BlockedUserId} for user {blockedUser.UserId}", ex);
        }
    }

    public async Task RemoveBlockedUser(BlockedUser blockedUser, CancellationToken cancellationToken = default)
    {
        try
        {
            var existingBlock = await _dbContext.BlockedUsers
                .FirstOrDefaultAsync(bu => bu.UserId == blockedUser.UserId && 
                                         bu.BlockedUserId == blockedUser.BlockedUserId && 
                                         !bu.IsDeleted, cancellationToken);

            if (existingBlock == null)
            {
                throw new InvalidOperationException("Block relationship not found");
            }

            _dbContext.BlockedUsers.Remove(existingBlock);
            await _dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException($"Failed to remove blocked user {blockedUser.BlockedUserId} for user {blockedUser.UserId}", ex);
        }
    }

    public async Task<bool> IsUserBlocked(string requestingUserId, string targetUserId, CancellationToken cancellationToken = default)
    {
        try
        {
            return await _dbContext.BlockedUsers
                .AsNoTracking()
                .AnyAsync(bu => ((bu.UserId == requestingUserId && bu.BlockedUserId == targetUserId) ||
                               (bu.UserId == targetUserId && bu.BlockedUserId == requestingUserId)) &&
                               !bu.IsDeleted, cancellationToken);
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException($"Failed to check if user {targetUserId} is blocked by user {requestingUserId}", ex);
        }
    }

    public async Task<(List<BlockedUser> blockedUsers, int totalCount)> GetBlockedUsers(string userId, int pageNumber, int pageSize, CancellationToken cancellationToken = default)
    {
        try
        {
            var query = _dbContext.BlockedUsers
                .Include(bu => bu.User)
                .Where(bu => bu.UserId == userId && !bu.IsDeleted);

            var totalCount = await query.CountAsync(cancellationToken);

            var blockedUsers = await query
                .OrderByDescending(bu => bu.BlockedAt)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync(cancellationToken);

            return (blockedUsers, totalCount);
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException($"Failed to get blocked users for user {userId}", ex);
        }
    }
}