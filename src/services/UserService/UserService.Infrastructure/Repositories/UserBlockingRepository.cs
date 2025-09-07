using Microsoft.EntityFrameworkCore;
using UserService.Domain.Models;
using UserService.Domain.Repositories;
using Core.Common.Exceptions;

namespace UserService.Infrastructure.Repositories;

public class UserBlockingRepository(
    UserDbContext userDbContext) : IUserBlockingRepository
{
    private readonly UserDbContext _dbContext = userDbContext;

    public async Task<BlockedUser?> GetBlockedUser(string userId, string blockedUserId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.BlockedUsers
            .AsNoTracking()
            .FirstOrDefaultAsync(bu => bu.UserId == userId && bu.BlockedUserId == blockedUserId && !bu.IsDeleted, 
                cancellationToken);
    }

    public async Task<BlockedUser> AddBlockedUser(BlockedUser blockedUser, CancellationToken cancellationToken = default)
    {
        // Check if the block relationship already exists
        var existingBlock = await _dbContext.BlockedUsers
            .FirstOrDefaultAsync(bu => bu.UserId == blockedUser.UserId && 
                                     bu.BlockedUserId == blockedUser.BlockedUserId && 
                                     !bu.IsDeleted, cancellationToken);

        if (existingBlock != null)
        {
            throw new ResourceAlreadyExistsException("BlockedUser", "UserId-BlockedUserId", $"{blockedUser.UserId}-{blockedUser.BlockedUserId}");
        }

        // Prevent self-blocking
        if (blockedUser.UserId == blockedUser.BlockedUserId)
        {
            throw new BusinessRuleViolationException("SELF_BLOCKING_NOT_ALLOWED", "SelfBlockingNotAllowed", "Users cannot block themselves");
        }

        _dbContext.BlockedUsers.Add(blockedUser);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return blockedUser;
    }

    public async Task RemoveBlockedUser(BlockedUser blockedUser, CancellationToken cancellationToken = default)
    {
        var existingBlock = await _dbContext.BlockedUsers
            .FirstOrDefaultAsync(bu => bu.UserId == blockedUser.UserId && 
                                     bu.BlockedUserId == blockedUser.BlockedUserId && 
                                     !bu.IsDeleted, cancellationToken);

        if (existingBlock == null)
        {
            throw new ResourceNotFoundException("BlockedUser", $"{blockedUser.UserId}-{blockedUser.BlockedUserId}");
        }

        _dbContext.BlockedUsers.Remove(existingBlock);
        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<bool> IsUserBlocked(string requestingUserId, string targetUserId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.BlockedUsers
            .AsNoTracking()
            .AnyAsync(bu => ((bu.UserId == requestingUserId && bu.BlockedUserId == targetUserId) ||
                           (bu.UserId == targetUserId && bu.BlockedUserId == requestingUserId)) &&
                           !bu.IsDeleted, cancellationToken);
    }

    public async Task<(List<BlockedUser> blockedUsers, int totalCount)> GetBlockedUsers(string userId, int pageNumber, int pageSize, CancellationToken cancellationToken = default)
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
}