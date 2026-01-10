using Microsoft.EntityFrameworkCore;
using MatchmakingService.Domain.Entities;
using MatchmakingService.Domain.Enums;
using MatchmakingService.Domain.Repositories;
using MatchmakingService.Infrastructure.Data;

namespace MatchmakingService.Infrastructure.Repositories;

/// <summary>
/// Repository implementation for MatchRequest entities.
/// Handles all data access operations for match requests.
/// </summary>
public class MatchRequestRepository : IMatchRequestRepository
{
    private readonly MatchmakingDbContext _dbContext;

    public MatchRequestRepository(MatchmakingDbContext dbContext)
    {
        _dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
    }

    // Expose IQueryable for complex LINQ operations
    public IQueryable<MatchRequest> Query => _dbContext.MatchRequests.Where(mr => !mr.IsDeleted);

    public async Task<MatchRequest?> GetByIdAsync(string requestId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.MatchRequests
            .FirstOrDefaultAsync(mr => mr.Id == requestId && !mr.IsDeleted, cancellationToken);
    }

    public async Task<MatchRequest?> GetByIdWithCounterOffersAsync(string requestId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.MatchRequests
            .Include(mr => mr.CounterOffers)
            .FirstOrDefaultAsync(mr => mr.Id == requestId && !mr.IsDeleted, cancellationToken);
    }

    public async Task<List<MatchRequest>> GetIncomingRequestsAsync(string userId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.MatchRequests
            .Where(mr => !mr.IsDeleted && mr.TargetUserId == userId)
            .OrderByDescending(mr => mr.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<MatchRequest>> GetOutgoingRequestsAsync(string userId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.MatchRequests
            .Where(mr => !mr.IsDeleted && mr.RequesterId == userId)
            .OrderByDescending(mr => mr.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<MatchRequest>> GetAcceptedRequestsAsync(string userId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.MatchRequests
            .Where(mr => !mr.IsDeleted &&
                (mr.RequesterId == userId || mr.TargetUserId == userId) &&
                mr.Status == MatchRequestStatus.Accepted)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<MatchRequest>> GetRequestsByThreadIdAsync(string threadId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.MatchRequests
            .Where(mr => !mr.IsDeleted && mr.ThreadId == threadId)
            .OrderBy(mr => mr.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<MatchRequest>> GetRequestsBySkillIdAsync(string skillId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.MatchRequests
            .Where(mr => !mr.IsDeleted && mr.SkillId == skillId)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<MatchRequest>> GetRequestsByStatusAsync(string status, CancellationToken cancellationToken = default)
    {
        return await _dbContext.MatchRequests
            .Where(mr => !mr.IsDeleted && mr.Status.ToString() == status)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<MatchRequest>> GetPendingRequestsForUserAsync(string userId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.MatchRequests
            .Where(mr => !mr.IsDeleted &&
                (mr.RequesterId == userId || mr.TargetUserId == userId) &&
                mr.Status == MatchRequestStatus.Pending)
            .ToListAsync(cancellationToken);
    }

    public async Task<bool> HasPendingRequestBetweenUsersAsync(string userId1, string userId2, string skillId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.MatchRequests
            .AnyAsync(mr => !mr.IsDeleted &&
                ((mr.RequesterId == userId1 && mr.TargetUserId == userId2) ||
                 (mr.RequesterId == userId2 && mr.TargetUserId == userId1)) &&
                mr.SkillId == skillId &&
                mr.Status == MatchRequestStatus.Pending, cancellationToken);
    }

    public async Task<MatchRequest> CreateAsync(MatchRequest matchRequest, CancellationToken cancellationToken = default)
    {
        await _dbContext.MatchRequests.AddAsync(matchRequest, cancellationToken);
        return matchRequest;
    }

    public async Task<MatchRequest> UpdateAsync(MatchRequest matchRequest, CancellationToken cancellationToken = default)
    {
        _dbContext.MatchRequests.Update(matchRequest);
        return await Task.FromResult(matchRequest);
    }

    public async Task DeleteAsync(string requestId, CancellationToken cancellationToken = default)
    {
        var request = await GetByIdAsync(requestId, cancellationToken);
        if (request != null)
        {
            _dbContext.MatchRequests.Remove(request);
        }
    }

    public async Task DeleteByUserIdAsync(string userId, CancellationToken cancellationToken = default)
    {
        var requests = await _dbContext.MatchRequests
            .Where(mr => !mr.IsDeleted && (mr.RequesterId == userId || mr.TargetUserId == userId))
            .ToListAsync(cancellationToken);

        if (requests.Any())
        {
            _dbContext.MatchRequests.RemoveRange(requests);
        }
    }

    public async Task DeleteBySkillIdAsync(string skillId, CancellationToken cancellationToken = default)
    {
        var requests = await GetRequestsBySkillIdAsync(skillId, cancellationToken);
        if (requests.Any())
        {
            _dbContext.MatchRequests.RemoveRange(requests);
        }
    }

    public async Task DeleteByThreadIdAsync(string threadId, CancellationToken cancellationToken = default)
    {
        var requests = await GetRequestsByThreadIdAsync(threadId, cancellationToken);
        if (requests.Any())
        {
            _dbContext.MatchRequests.RemoveRange(requests);
        }
    }

    public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return await _dbContext.SaveChangesAsync(cancellationToken);
    }
}
