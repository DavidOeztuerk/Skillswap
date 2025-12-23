using MatchmakingService.Domain.Entities;

namespace MatchmakingService.Domain.Repositories;

/// <summary>
/// Repository interface for Match entities.
/// Defines all data access operations for matches.
/// </summary>
public interface IMatchRepository
{
    // Direct queryable access for complex LINQ operations
    IQueryable<Match> Query { get; }

    // Query operations
    Task<Match?> GetByIdAsync(string matchId, CancellationToken cancellationToken = default);
    Task<Match?> GetByIdWithRequestAsync(string matchId, CancellationToken cancellationToken = default);
    Task<Match?> GetByAcceptedRequestIdAsync(string requestId, CancellationToken cancellationToken = default);
    Task<List<Match>> GetUserMatchesAsync(string userId, CancellationToken cancellationToken = default);
    Task<List<Match>> GetUserMatchesWithRequestsAsync(string userId, CancellationToken cancellationToken = default);
    Task<List<Match>> GetActiveMatchesAsync(string userId, CancellationToken cancellationToken = default);
    Task<List<Match>> GetCompletedMatchesAsync(string userId, CancellationToken cancellationToken = default);
    Task<List<Match>> GetMatchesBySkillIdAsync(string skillId, CancellationToken cancellationToken = default);
    Task<List<Match>> GetMatchesByStatusAsync(string status, CancellationToken cancellationToken = default);
    Task<(int total, int active, int completed, int dissolved)> GetMatchStatisticsAsync(string userId, CancellationToken cancellationToken = default);

    // Create operations
    Task<Match> CreateAsync(Match match, CancellationToken cancellationToken = default);

    // Update operations
    Task<Match> UpdateAsync(Match match, CancellationToken cancellationToken = default);

    // Delete operations
    Task DeleteAsync(string matchId, CancellationToken cancellationToken = default);
    Task DeleteByUserIdAsync(string userId, CancellationToken cancellationToken = default);
    Task DeleteBySkillIdAsync(string skillId, CancellationToken cancellationToken = default);

    // Save changes
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
