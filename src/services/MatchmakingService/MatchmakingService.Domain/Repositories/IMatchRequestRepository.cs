using MatchmakingService.Domain.Entities;

namespace MatchmakingService.Domain.Repositories;

/// <summary>
/// Repository interface for MatchRequest entities.
/// Defines all data access operations for match requests.
/// </summary>
public interface IMatchRequestRepository
{
    // Direct queryable access for complex LINQ operations
    IQueryable<MatchRequest> Query { get; }

    // Query operations
    Task<MatchRequest?> GetByIdAsync(string requestId, CancellationToken cancellationToken = default);
    Task<MatchRequest?> GetByIdWithCounterOffersAsync(string requestId, CancellationToken cancellationToken = default);
    Task<List<MatchRequest>> GetIncomingRequestsAsync(string userId, CancellationToken cancellationToken = default);
    Task<List<MatchRequest>> GetOutgoingRequestsAsync(string userId, CancellationToken cancellationToken = default);
    Task<List<MatchRequest>> GetAcceptedRequestsAsync(string userId, CancellationToken cancellationToken = default);
    Task<List<MatchRequest>> GetRequestsByThreadIdAsync(string threadId, CancellationToken cancellationToken = default);
    Task<List<MatchRequest>> GetRequestsBySkillIdAsync(string skillId, CancellationToken cancellationToken = default);
    Task<List<MatchRequest>> GetRequestsByStatusAsync(string status, CancellationToken cancellationToken = default);
    Task<List<MatchRequest>> GetPendingRequestsForUserAsync(string userId, CancellationToken cancellationToken = default);
    Task<bool> HasPendingRequestBetweenUsersAsync(string userId1, string userId2, string skillId, CancellationToken cancellationToken = default);

    // Create operations
    Task<MatchRequest> CreateAsync(MatchRequest matchRequest, CancellationToken cancellationToken = default);

    // Update operations
    Task<MatchRequest> UpdateAsync(MatchRequest matchRequest, CancellationToken cancellationToken = default);

    // Delete operations
    Task DeleteAsync(string requestId, CancellationToken cancellationToken = default);
    Task DeleteByUserIdAsync(string userId, CancellationToken cancellationToken = default);
    Task DeleteBySkillIdAsync(string skillId, CancellationToken cancellationToken = default);
    Task DeleteByThreadIdAsync(string threadId, CancellationToken cancellationToken = default);

    // Save changes
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
