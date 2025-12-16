using Microsoft.EntityFrameworkCore;
using VideocallService.Domain.Entities;
using VideocallService.Domain.Repositories;
using VideocallService.Infrastructure.Data;

namespace VideocallService.Infrastructure.Repositories;

/// <summary>
/// Repository implementation for VideoCallSession entities.
/// Handles all data access operations for video call sessions.
/// </summary>
public class VideoCallSessionRepository : IVideoCallSessionRepository
{
    private readonly VideoCallDbContext _dbContext;

    public VideoCallSessionRepository(VideoCallDbContext dbContext)
    {
        _dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
    }

    public async Task<VideoCallSession?> GetByIdAsync(string sessionId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.VideoCallSessions
            .FirstOrDefaultAsync(s => s.Id == sessionId && !s.IsDeleted, cancellationToken);
    }

    public async Task<VideoCallSession?> GetByIdWithParticipantsAsync(string sessionId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.VideoCallSessions
            .Include(s => s.Participants)
            .FirstOrDefaultAsync(s => s.Id == sessionId && !s.IsDeleted, cancellationToken);
    }

    public async Task<VideoCallSession?> GetByRoomIdAsync(string roomId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.VideoCallSessions
            .FirstOrDefaultAsync(s => s.RoomId == roomId && !s.IsDeleted, cancellationToken);
    }

    public async Task<VideoCallSession?> GetByRoomIdWithParticipantsAsync(string roomId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.VideoCallSessions
            .Include(s => s.Participants)
            .FirstOrDefaultAsync(s => s.RoomId == roomId && !s.IsDeleted, cancellationToken);
    }

    public async Task<List<VideoCallSession>> GetUserSessionsAsync(string userId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.VideoCallSessions
            .Where(s => (s.InitiatorUserId == userId || s.ParticipantUserId == userId) && !s.IsDeleted)
            .OrderByDescending(s => s.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<VideoCallSession>> GetActiveSessionsByUserAsync(string userId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.VideoCallSessions
            .Where(s => (s.InitiatorUserId == userId || s.ParticipantUserId == userId)
                && s.Status == CallStatus.Active
                && !s.IsDeleted)
            .ToListAsync(cancellationToken);
    }

    public async Task<VideoCallSession?> GetActiveSessionForUsersAsync(string userId1, string userId2, CancellationToken cancellationToken = default)
    {
        return await _dbContext.VideoCallSessions
            .FirstOrDefaultAsync(s =>
                ((s.InitiatorUserId == userId1 && s.ParticipantUserId == userId2) ||
                 (s.InitiatorUserId == userId2 && s.ParticipantUserId == userId1)) &&
                s.Status == CallStatus.Active &&
                !s.IsDeleted, cancellationToken);
    }

    public async Task<List<VideoCallSession>> GetSessionsByAppointmentIdAsync(string appointmentId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.VideoCallSessions
            .Where(s => s.AppointmentId == appointmentId && !s.IsDeleted)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<VideoCallSession>> GetSessionsByMatchIdAsync(string matchId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.VideoCallSessions
            .Where(s => s.MatchId == matchId && !s.IsDeleted)
            .ToListAsync(cancellationToken);
    }

    public async Task<bool> HasActiveSessionAsync(string userId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.VideoCallSessions
            .AnyAsync(s =>
                (s.InitiatorUserId == userId || s.ParticipantUserId == userId) &&
                s.Status == CallStatus.Active &&
                !s.IsDeleted, cancellationToken);
    }

    public async Task<VideoCallSession> CreateAsync(VideoCallSession session, CancellationToken cancellationToken = default)
    {
        await _dbContext.VideoCallSessions.AddAsync(session, cancellationToken);
        return session;
    }

    public async Task<VideoCallSession> UpdateAsync(VideoCallSession session, CancellationToken cancellationToken = default)
    {
        _dbContext.VideoCallSessions.Update(session);
        return await Task.FromResult(session);
    }

    public async Task DeleteAsync(string sessionId, CancellationToken cancellationToken = default)
    {
        var session = await GetByIdAsync(sessionId, cancellationToken);
        if (session != null)
        {
            _dbContext.VideoCallSessions.Remove(session);
        }
    }

    public async Task DeleteByUserIdAsync(string userId, CancellationToken cancellationToken = default)
    {
        var sessions = await _dbContext.VideoCallSessions
            .Where(s => s.HostUserId == userId && !s.IsDeleted)
            .ToListAsync(cancellationToken);

        if (sessions.Any())
        {
            _dbContext.VideoCallSessions.RemoveRange(sessions);
        }
    }

    public async Task DeleteByAppointmentIdAsync(string appointmentId, CancellationToken cancellationToken = default)
    {
        var sessions = await GetSessionsByAppointmentIdAsync(appointmentId, cancellationToken);
        if (sessions.Any())
        {
            _dbContext.VideoCallSessions.RemoveRange(sessions);
        }
    }

    public async Task DeleteByMatchIdAsync(string matchId, CancellationToken cancellationToken = default)
    {
        var sessions = await GetSessionsByMatchIdAsync(matchId, cancellationToken);
        if (sessions.Any())
        {
            _dbContext.VideoCallSessions.RemoveRange(sessions);
        }
    }

    public async Task<List<VideoCallSession>> GetActiveSessionsAsync(CancellationToken cancellationToken = default)
    {
        return await _dbContext.VideoCallSessions
            .Where(s => s.Status == CallStatus.Pending || s.Status == CallStatus.Active)
            .ToListAsync(cancellationToken);
    }

    public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return await _dbContext.SaveChangesAsync(cancellationToken);
    }
}
