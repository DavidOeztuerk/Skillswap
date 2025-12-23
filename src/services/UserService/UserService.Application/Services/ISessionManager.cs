using UserService.Domain.Models;

namespace UserService.Application.Services;

/// <summary>
/// Manages user sessions with concurrent login control
/// </summary>
public interface ISessionManager
{
    /// <summary>
    /// Creates a new session with concurrent session limit enforcement
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <param name="deviceFingerprint">Device fingerprint</param>
    /// <param name="ipAddress">IP address</param>
    /// <param name="userAgent">User agent</param>
    /// <param name="deviceType">Device type (Mobile, Desktop, Tablet)</param>
    /// <param name="browser">Browser name</param>
    /// <param name="operatingSystem">Operating system</param>
    /// <param name="screenResolution">Screen resolution</param>
    /// <param name="timeZone">Time zone</param>
    /// <param name="language">Language</param>
    /// <param name="maxConcurrentSessions">Maximum allowed concurrent sessions (default 3)</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>New session</returns>
    Task<UserSession> CreateSessionAsync(
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
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets active sessions count for user
    /// </summary>
    Task<int> GetActiveSessionsCountAsync(string userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets all active sessions for user
    /// </summary>
    Task<List<UserSession>> GetActiveSessionsAsync(string userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Validates if session is still valid
    /// </summary>
    Task<bool> ValidateSessionAsync(string sessionId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Updates session last activity
    /// </summary>
    Task UpdateSessionActivityAsync(string sessionId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Ends a session
    /// </summary>
    Task EndSessionAsync(string sessionId, string? reason = null, CancellationToken cancellationToken = default);

    /// <summary>
    /// Ends all sessions for user (except current)
    /// </summary>
    Task EndOtherSessionsAsync(string userId, string currentSessionId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Ends all sessions for user
    /// </summary>
    Task EndAllUserSessionsAsync(string userId, string? reason = null, CancellationToken cancellationToken = default);

    /// <summary>
    /// Cleans up expired sessions
    /// </summary>
    Task<int> CleanupExpiredSessionsAsync(CancellationToken cancellationToken = default);
}
