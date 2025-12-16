using VideocallService.Domain.Entities;

namespace VideocallService.Domain.Repositories;

/// <summary>
/// Repository interface for VideoCallSession entities.
/// Defines all data access operations for video call sessions.
/// </summary>
public interface IVideoCallSessionRepository
{
    // Query operations
    Task<VideoCallSession?> GetByIdAsync(string sessionId, CancellationToken cancellationToken = default);
    Task<VideoCallSession?> GetByIdWithParticipantsAsync(string sessionId, CancellationToken cancellationToken = default);
    Task<VideoCallSession?> GetByRoomIdAsync(string roomId, CancellationToken cancellationToken = default);
    Task<VideoCallSession?> GetByRoomIdWithParticipantsAsync(string roomId, CancellationToken cancellationToken = default);
    Task<List<VideoCallSession>> GetUserSessionsAsync(string userId, CancellationToken cancellationToken = default);
    Task<List<VideoCallSession>> GetActiveSessionsByUserAsync(string userId, CancellationToken cancellationToken = default);
    Task<VideoCallSession?> GetActiveSessionForUsersAsync(string userId1, string userId2, CancellationToken cancellationToken = default);
    Task<List<VideoCallSession>> GetSessionsByAppointmentIdAsync(string appointmentId, CancellationToken cancellationToken = default);
    Task<List<VideoCallSession>> GetSessionsByMatchIdAsync(string matchId, CancellationToken cancellationToken = default);
    Task<bool> HasActiveSessionAsync(string userId, CancellationToken cancellationToken = default);
    Task<List<VideoCallSession>> GetActiveSessionsAsync(CancellationToken cancellationToken = default);

    // Create operations
    Task<VideoCallSession> CreateAsync(VideoCallSession session, CancellationToken cancellationToken = default);

    // Update operations
    Task<VideoCallSession> UpdateAsync(VideoCallSession session, CancellationToken cancellationToken = default);

    // Delete operations
    Task DeleteAsync(string sessionId, CancellationToken cancellationToken = default);
    Task DeleteByUserIdAsync(string userId, CancellationToken cancellationToken = default);
    Task DeleteByAppointmentIdAsync(string appointmentId, CancellationToken cancellationToken = default);
    Task DeleteByMatchIdAsync(string matchId, CancellationToken cancellationToken = default);

    // Save changes
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
