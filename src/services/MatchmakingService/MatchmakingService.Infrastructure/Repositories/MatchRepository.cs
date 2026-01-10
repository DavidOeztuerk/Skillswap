using Microsoft.EntityFrameworkCore;
using MatchmakingService.Domain.Entities;
using MatchmakingService.Domain.Enums;
using MatchmakingService.Domain.Repositories;
using MatchmakingService.Infrastructure.Data;

namespace MatchmakingService.Infrastructure.Repositories;

/// <summary>
/// Repository implementation for Match entities.
/// Handles all data access operations for matches.
/// </summary>
public class MatchRepository : IMatchRepository
{
    private readonly MatchmakingDbContext _dbContext;

    public MatchRepository(MatchmakingDbContext dbContext)
    {
        _dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
    }

    // Expose IQueryable for complex LINQ operations
    public IQueryable<Match> Query => _dbContext.Matches.Where(m => !m.IsDeleted);

    public async Task<Match?> GetByIdAsync(string matchId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.Matches
            .FirstOrDefaultAsync(m => m.Id == matchId && !m.IsDeleted, cancellationToken);
    }

    public async Task<Match?> GetByIdWithRequestAsync(string matchId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.Matches
            .Include(m => m.AcceptedMatchRequest)
            .FirstOrDefaultAsync(m => m.Id == matchId && !m.IsDeleted, cancellationToken);
    }

    public async Task<Match?> GetByAcceptedRequestIdAsync(string requestId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.Matches
            .Include(m => m.AcceptedMatchRequest)
            .FirstOrDefaultAsync(m => m.AcceptedMatchRequestId == requestId && !m.IsDeleted, cancellationToken);
    }

    public async Task<List<Match>> GetUserMatchesAsync(string userId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.Matches
            .Include(m => m.AcceptedMatchRequest)
            .Where(m => !m.IsDeleted &&
                (m.AcceptedMatchRequest.RequesterId == userId || m.AcceptedMatchRequest.TargetUserId == userId))
            .OrderByDescending(m => m.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<Match>> GetUserMatchesWithRequestsAsync(string userId, CancellationToken cancellationToken = default)
    {
        return await GetUserMatchesAsync(userId, cancellationToken);
    }

    public async Task<List<Match>> GetActiveMatchesAsync(string userId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.Matches
            .Include(m => m.AcceptedMatchRequest)
            .Where(m => !m.IsDeleted &&
                (m.AcceptedMatchRequest.RequesterId == userId || m.AcceptedMatchRequest.TargetUserId == userId) &&
                m.Status == MatchStatus.Accepted)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<Match>> GetCompletedMatchesAsync(string userId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.Matches
            .Include(m => m.AcceptedMatchRequest)
            .Where(m => !m.IsDeleted &&
                (m.AcceptedMatchRequest.RequesterId == userId || m.AcceptedMatchRequest.TargetUserId == userId) &&
                m.Status == MatchStatus.Completed)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<Match>> GetMatchesBySkillIdAsync(string skillId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.Matches
            .Include(m => m.AcceptedMatchRequest)
            .Where(m => !m.IsDeleted && m.AcceptedMatchRequest.SkillId == skillId)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<Match>> GetMatchesByStatusAsync(string status, CancellationToken cancellationToken = default)
    {
        return await _dbContext.Matches
            .Include(m => m.AcceptedMatchRequest)
            .Where(m => !m.IsDeleted && m.Status.ToString() == status)
            .ToListAsync(cancellationToken);
    }

    public async Task<(int total, int active, int completed, int dissolved)> GetMatchStatisticsAsync(string userId, CancellationToken cancellationToken = default)
    {
        var matches = await GetUserMatchesAsync(userId, cancellationToken);

        var total = matches.Count;
        var active = matches.Count(m => m.Status == MatchStatus.Accepted);
        var completed = matches.Count(m => m.Status == MatchStatus.Completed);
        var dissolved = matches.Count(m => m.Status == MatchStatus.Dissolved);

        return (total, active, completed, dissolved);
    }

    public async Task<Match> CreateAsync(Match match, CancellationToken cancellationToken = default)
    {
        await _dbContext.Matches.AddAsync(match, cancellationToken);
        return match;
    }

    public async Task<Match> UpdateAsync(Match match, CancellationToken cancellationToken = default)
    {
        _dbContext.Matches.Update(match);
        return await Task.FromResult(match);
    }

    public async Task DeleteAsync(string matchId, CancellationToken cancellationToken = default)
    {
        var match = await GetByIdAsync(matchId, cancellationToken);
        if (match != null)
        {
            _dbContext.Matches.Remove(match);
        }
    }

    public async Task DeleteByUserIdAsync(string userId, CancellationToken cancellationToken = default)
    {
        var matches = await GetUserMatchesAsync(userId, cancellationToken);
        if (matches.Any())
        {
            _dbContext.Matches.RemoveRange(matches);
        }
    }

    public async Task DeleteBySkillIdAsync(string skillId, CancellationToken cancellationToken = default)
    {
        var matches = await GetMatchesBySkillIdAsync(skillId, cancellationToken);
        if (matches.Any())
        {
            _dbContext.Matches.RemoveRange(matches);
        }
    }

    public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return await _dbContext.SaveChangesAsync(cancellationToken);
    }
}
