using Microsoft.EntityFrameworkCore;
using VideocallService.Domain.Entities;
using VideocallService.Domain.Repositories;
using VideocallService.Infrastructure.Data;

namespace VideocallService.Infrastructure.Repositories;

/// <summary>
/// Repository implementation for E2EE Audit Logs
/// </summary>
public class E2EEAuditLogRepository : IE2EEAuditLogRepository
{
    private readonly VideoCallDbContext _context;

    public E2EEAuditLogRepository(VideoCallDbContext context)
    {
        _context = context;
    }

    public async Task<E2EEAuditLog> AddAsync(
        E2EEAuditLog auditLog,
        CancellationToken cancellationToken = default)
    {
        await _context.E2EEAuditLogs.AddAsync(auditLog, cancellationToken);
        return auditLog;
    }

    public async Task<IReadOnlyList<E2EEAuditLog>> GetBySessionIdAsync(
        string sessionId,
        CancellationToken cancellationToken = default)
    {
        return await _context.E2EEAuditLogs
            .Where(l => l.SessionId == sessionId)
            .OrderByDescending(l => l.ServerTimestamp)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<E2EEAuditLog>> GetByRoomIdAsync(
        string roomId,
        CancellationToken cancellationToken = default)
    {
        return await _context.E2EEAuditLogs
            .Where(l => l.RoomId == roomId)
            .OrderByDescending(l => l.ServerTimestamp)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<E2EEAuditLog>> GetByUserIdAsync(
        string userId,
        CancellationToken cancellationToken = default)
    {
        return await _context.E2EEAuditLogs
            .Where(l => l.FromUserId == userId)
            .OrderByDescending(l => l.ServerTimestamp)
            .Take(100) // Limit to last 100 operations
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<E2EEAuditLog>> GetFailedOperationsAsync(
        DateTime from,
        DateTime to,
        CancellationToken cancellationToken = default)
    {
        return await _context.E2EEAuditLogs
            .Where(l => !l.Success &&
                        l.ServerTimestamp >= from &&
                        l.ServerTimestamp <= to)
            .OrderByDescending(l => l.ServerTimestamp)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<E2EEAuditLog>> GetRateLimitedOperationsAsync(
        DateTime from,
        DateTime to,
        CancellationToken cancellationToken = default)
    {
        return await _context.E2EEAuditLogs
            .Where(l => l.WasRateLimited &&
                        l.ServerTimestamp >= from &&
                        l.ServerTimestamp <= to)
            .OrderByDescending(l => l.ServerTimestamp)
            .ToListAsync(cancellationToken);
    }

    public async Task<int> CountByUserInWindowAsync(
        string userId,
        DateTime from,
        DateTime to,
        CancellationToken cancellationToken = default)
    {
        return await _context.E2EEAuditLogs
            .CountAsync(l => l.FromUserId == userId &&
                             l.ServerTimestamp >= from &&
                             l.ServerTimestamp <= to,
                        cancellationToken);
    }
}
