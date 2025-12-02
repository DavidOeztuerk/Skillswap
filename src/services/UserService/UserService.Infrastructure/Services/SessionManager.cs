using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using UserService.Application.Services;
using UserService.Domain.Models;
using Infrastructure.Security.Monitoring;

namespace UserService.Infrastructure.Services;

/// <summary>
/// Implements session management with concurrent login control
/// </summary>
public class SessionManager : ISessionManager
{
    private readonly UserDbContext _dbContext;
    private readonly ILogger<SessionManager> _logger;
    private readonly ISecurityAlertService _securityAlertService;

    public SessionManager(
        UserDbContext dbContext,
        ILogger<SessionManager> logger,
        ISecurityAlertService securityAlertService)
    {
        _dbContext = dbContext;
        _logger = logger;
        _securityAlertService = securityAlertService;
    }

    public async Task<UserSession> CreateSessionAsync(
        string userId,
        string deviceFingerprint,
        string? ipAddress = null,
        string? userAgent = null,
        string? deviceType = null,
        string? browser = null,
        string? operatingSystem = null,
        string? screenResolution = null,
        string? timeZone = null,
        string? language = null,
        int maxConcurrentSessions = 3,
        CancellationToken cancellationToken = default)
    {
        // Get active sessions count
        var activeSessions = await GetActiveSessionsAsync(userId, cancellationToken);
        var activeCount = activeSessions.Count;

        _logger.LogInformation(
            "User {UserId} has {ActiveCount} active sessions (max: {MaxSessions})",
            userId,
            activeCount,
            maxConcurrentSessions);

        // Enforce concurrent session limit
        if (activeCount >= maxConcurrentSessions)
        {
            _logger.LogWarning(
                "User {UserId} exceeded max concurrent sessions ({MaxSessions}). Revoking oldest session.",
                userId,
                maxConcurrentSessions);

            // Send security alert
            await _securityAlertService.SendAlertAsync(
                SecurityAlertLevel.Medium,
                SecurityAlertType.ConcurrentSessionLimitExceeded,
                "Concurrent Session Limit Exceeded",
                $"User exceeded maximum concurrent sessions limit ({maxConcurrentSessions}). Oldest session will be revoked.",
                new Dictionary<string, object>
                {
                    ["UserId"] = userId,
                    ["ActiveSessionsCount"] = activeCount,
                    ["MaxSessionsAllowed"] = maxConcurrentSessions,
                    ["NewDeviceFingerprint"] = deviceFingerprint,
                    ["IpAddress"] = ipAddress ?? "unknown",
                    ["UserAgent"] = userAgent ?? "unknown"
                },
                cancellationToken);

            // Revoke oldest session
            var oldestSession = activeSessions
                .OrderBy(s => s.StartedAt)
                .FirstOrDefault();

            if (oldestSession != null)
            {
                await EndSessionAsync(
                    oldestSession.SessionToken,
                    "Exceeded maximum concurrent sessions",
                    cancellationToken);
            }
        }

        // Check if same device already has active session
        var existingDeviceSession = activeSessions
            .FirstOrDefault(s => s.DeviceFingerprint == deviceFingerprint);

        if (existingDeviceSession != null)
        {
            _logger.LogInformation(
                "Device {DeviceFingerprint} already has active session. Revoking old session.",
                deviceFingerprint);

            await EndSessionAsync(
                existingDeviceSession.SessionToken,
                "New login from same device",
                cancellationToken);
        }

        // Create new session
        var session = new UserSession
        {
            Id = Guid.NewGuid().ToString(),
            UserId = userId,
            SessionToken = Guid.NewGuid().ToString(),
            DeviceFingerprint = deviceFingerprint,
            IpAddress = ipAddress,
            UserAgent = userAgent,
            DeviceType = deviceType,
            Browser = browser,
            OperatingSystem = operatingSystem,
            ScreenResolution = screenResolution,
            TimeZone = timeZone,
            Language = language,
            StartedAt = DateTime.UtcNow,
            LastActivity = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddHours(24),
            IsActive = true,
            IsRevoked = false,
            CreatedAt = DateTime.UtcNow
        };

        _dbContext.UserSessions.Add(session);
        await _dbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Created session {SessionId} for user {UserId} from device {DeviceFingerprint}",
            session.SessionToken,
            userId,
            deviceFingerprint);

        return session;
    }

    public async Task<int> GetActiveSessionsCountAsync(string userId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.UserSessions
            .Where(s => s.UserId == userId &&
                       s.IsActive &&
                       !s.IsRevoked &&
                       !s.IsDeleted &&
                       s.ExpiresAt > DateTime.UtcNow)
            .CountAsync(cancellationToken);
    }

    public async Task<List<UserSession>> GetActiveSessionsAsync(string userId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.UserSessions
            .Where(s => s.UserId == userId &&
                       s.IsActive &&
                       !s.IsRevoked &&
                       !s.IsDeleted &&
                       s.ExpiresAt > DateTime.UtcNow)
            .OrderByDescending(s => s.LastActivity)
            .ToListAsync(cancellationToken);
    }

    public async Task<bool> ValidateSessionAsync(string sessionId, CancellationToken cancellationToken = default)
    {
        var session = await _dbContext.UserSessions
            .FirstOrDefaultAsync(s => s.SessionToken == sessionId, cancellationToken);

        if (session == null)
        {
            _logger.LogWarning("Session {SessionId} not found", sessionId);
            return false;
        }

        if (!session.IsValid)
        {
            _logger.LogWarning(
                "Session {SessionId} is invalid. Active: {IsActive}, Revoked: {IsRevoked}, Expired: {IsExpired}",
                sessionId,
                session.IsActive,
                session.IsRevoked,
                session.IsExpired);
            return false;
        }

        return true;
    }

    public async Task UpdateSessionActivityAsync(string sessionId, CancellationToken cancellationToken = default)
    {
        var session = await _dbContext.UserSessions
            .FirstOrDefaultAsync(s => s.SessionToken == sessionId, cancellationToken);

        if (session != null && session.IsValid)
        {
            session.LastActivity = DateTime.UtcNow;
            await _dbContext.SaveChangesAsync(cancellationToken);

            _logger.LogDebug("Updated session {SessionId} last activity", sessionId);
        }
    }

    public async Task EndSessionAsync(string sessionId, string? reason = null, CancellationToken cancellationToken = default)
    {
        var session = await _dbContext.UserSessions
            .FirstOrDefaultAsync(s => s.SessionToken == sessionId, cancellationToken);

        if (session != null)
        {
            session.IsActive = false;
            session.IsRevoked = true;
            session.RevokedAt = DateTime.UtcNow;
            session.RevokedReason = reason ?? "User logout";
            session.EndedAt = DateTime.UtcNow;

            await _dbContext.SaveChangesAsync(cancellationToken);

            _logger.LogInformation(
                "Ended session {SessionId} for user {UserId}. Reason: {Reason}",
                sessionId,
                session.UserId,
                reason ?? "User logout");
        }
    }

    public async Task EndOtherSessionsAsync(string userId, string currentSessionId, CancellationToken cancellationToken = default)
    {
        var otherSessions = await _dbContext.UserSessions
            .Where(s => s.UserId == userId &&
                       s.SessionToken != currentSessionId &&
                       s.IsActive &&
                       !s.IsRevoked &&
                       !s.IsDeleted)
            .ToListAsync(cancellationToken);

        foreach (var session in otherSessions)
        {
            session.IsActive = false;
            session.IsRevoked = true;
            session.RevokedAt = DateTime.UtcNow;
            session.RevokedReason = "User ended other sessions";
            session.EndedAt = DateTime.UtcNow;
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Ended {Count} other sessions for user {UserId}",
            otherSessions.Count,
            userId);
    }

    public async Task EndAllUserSessionsAsync(string userId, string? reason = null, CancellationToken cancellationToken = default)
    {
        var sessions = await _dbContext.UserSessions
            .Where(s => s.UserId == userId &&
                       s.IsActive &&
                       !s.IsRevoked &&
                       !s.IsDeleted)
            .ToListAsync(cancellationToken);

        foreach (var session in sessions)
        {
            session.IsActive = false;
            session.IsRevoked = true;
            session.RevokedAt = DateTime.UtcNow;
            session.RevokedReason = reason ?? "All sessions terminated";
            session.EndedAt = DateTime.UtcNow;
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        _logger.LogWarning(
            "Ended all {Count} sessions for user {UserId}. Reason: {Reason}",
            sessions.Count,
            userId,
            reason ?? "All sessions terminated");
    }

    public async Task<int> CleanupExpiredSessionsAsync(CancellationToken cancellationToken = default)
    {
        var expiredSessions = await _dbContext.UserSessions
            .Where(s => (s.ExpiresAt < DateTime.UtcNow ||
                        s.LastActivity < DateTime.UtcNow.AddDays(-7)) &&
                       s.IsActive)
            .ToListAsync(cancellationToken);

        foreach (var session in expiredSessions)
        {
            session.IsActive = false;
            session.IsRevoked = true;
            session.RevokedAt = DateTime.UtcNow;
            session.RevokedReason = "Session expired or inactive";
            session.EndedAt = DateTime.UtcNow;
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Cleaned up {Count} expired sessions", expiredSessions.Count);

        return expiredSessions.Count;
    }
}
