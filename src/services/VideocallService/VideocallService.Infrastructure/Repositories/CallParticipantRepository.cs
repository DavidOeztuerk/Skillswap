using Microsoft.EntityFrameworkCore;
using VideocallService.Domain.Entities;
using VideocallService.Domain.Repositories;
using VideocallService.Infrastructure.Data;

namespace VideocallService.Infrastructure.Repositories;

/// <summary>
/// Repository implementation for CallParticipant entities.
/// Handles all data access operations for call participants.
/// </summary>
public class CallParticipantRepository : ICallParticipantRepository
{
    private readonly VideoCallDbContext _dbContext;

    public CallParticipantRepository(VideoCallDbContext dbContext)
    {
        _dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
    }

    public async Task<CallParticipant?> GetByIdAsync(string participantId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.CallParticipants
            .FirstOrDefaultAsync(p => p.Id == participantId && !p.IsDeleted, cancellationToken);
    }

    public async Task<List<CallParticipant>> GetBySessionIdAsync(string sessionId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.CallParticipants
            .Where(p => p.SessionId == sessionId && !p.IsDeleted)
            .OrderBy(p => p.JoinedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<CallParticipant>> GetByUserIdAsync(string userId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.CallParticipants
            .Where(p => p.UserId == userId && !p.IsDeleted)
            .OrderByDescending(p => p.JoinedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<CallParticipant?> GetActiveParticipantInSessionAsync(string sessionId, string userId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.CallParticipants
            .FirstOrDefaultAsync(p =>
                p.SessionId == sessionId &&
                p.UserId == userId &&
                p.LeftAt == null &&
                !p.IsDeleted, cancellationToken);
    }

    public async Task<List<CallParticipant>> GetActiveParticipantsInSessionAsync(string sessionId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.CallParticipants
            .Where(p => p.SessionId == sessionId && p.LeftAt == null && !p.IsDeleted)
            .ToListAsync(cancellationToken);
    }

    public async Task<CallParticipant> CreateAsync(CallParticipant participant, CancellationToken cancellationToken = default)
    {
        await _dbContext.CallParticipants.AddAsync(participant, cancellationToken);
        return participant;
    }

    public async Task<CallParticipant> UpdateAsync(CallParticipant participant, CancellationToken cancellationToken = default)
    {
        _dbContext.CallParticipants.Update(participant);
        return await Task.FromResult(participant);
    }

    public async Task DeleteAsync(string participantId, CancellationToken cancellationToken = default)
    {
        var participant = await GetByIdAsync(participantId, cancellationToken);
        if (participant != null)
        {
            _dbContext.CallParticipants.Remove(participant);
        }
    }

    public async Task DeleteBySessionIdAsync(string sessionId, CancellationToken cancellationToken = default)
    {
        var participants = await GetBySessionIdAsync(sessionId, cancellationToken);
        if (participants.Any())
        {
            _dbContext.CallParticipants.RemoveRange(participants);
        }
    }

    public async Task DeleteByUserIdAsync(string userId, CancellationToken cancellationToken = default)
    {
        var participants = await _dbContext.CallParticipants
            .Where(p => p.UserId == userId && !p.IsDeleted)
            .ToListAsync(cancellationToken);

        if (participants.Any())
        {
            _dbContext.CallParticipants.RemoveRange(participants);
        }
    }

    public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return await _dbContext.SaveChangesAsync(cancellationToken);
    }
}
