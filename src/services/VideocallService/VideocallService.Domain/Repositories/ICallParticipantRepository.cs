using VideocallService.Domain.Entities;

namespace VideocallService.Domain.Repositories;

/// <summary>
/// Repository interface for CallParticipant entities.
/// Defines all data access operations for call participants.
/// </summary>
public interface ICallParticipantRepository
{
    // Query operations
    Task<CallParticipant?> GetByIdAsync(string participantId, CancellationToken cancellationToken = default);
    Task<List<CallParticipant>> GetBySessionIdAsync(string sessionId, CancellationToken cancellationToken = default);
    Task<List<CallParticipant>> GetByUserIdAsync(string userId, CancellationToken cancellationToken = default);
    Task<CallParticipant?> GetActiveParticipantInSessionAsync(string sessionId, string userId, CancellationToken cancellationToken = default);
    Task<List<CallParticipant>> GetActiveParticipantsInSessionAsync(string sessionId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets the most recent participant record for a user in a session (including left participants).
    /// Used for rejoin logic - allows reactivating a previous participant instead of creating a new one.
    /// </summary>
    Task<CallParticipant?> GetMostRecentParticipantInSessionAsync(string sessionId, string userId, CancellationToken cancellationToken = default);

    // Create operations
    Task<CallParticipant> CreateAsync(CallParticipant participant, CancellationToken cancellationToken = default);

    // Update operations
    Task<CallParticipant> UpdateAsync(CallParticipant participant, CancellationToken cancellationToken = default);

    // Delete operations
    Task DeleteAsync(string participantId, CancellationToken cancellationToken = default);
    Task DeleteBySessionIdAsync(string sessionId, CancellationToken cancellationToken = default);
    Task DeleteByUserIdAsync(string userId, CancellationToken cancellationToken = default);

    // Save changes
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
