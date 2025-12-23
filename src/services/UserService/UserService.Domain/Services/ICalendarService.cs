namespace UserService.Domain.Services;

/// <summary>
/// Represents a busy time slot from an external calendar
/// </summary>
public record CalendarBusySlot
{
    public DateTime Start { get; init; }
    public DateTime End { get; init; }
    public string? Title { get; init; } // Optional, may not be available for privacy
}

/// <summary>
/// Result of a busy times query
/// </summary>
public record BusyTimesResult
{
    public bool Success { get; init; }
    public List<CalendarBusySlot> BusySlots { get; init; } = [];
    public string? Error { get; init; }

    public static BusyTimesResult Succeeded(List<CalendarBusySlot> slots) =>
        new() { Success = true, BusySlots = slots };

    public static BusyTimesResult Failed(string error) =>
        new() { Success = false, Error = error };
}

/// <summary>
/// Represents an appointment to sync to external calendar
/// </summary>
public record CalendarAppointment
{
    public string Id { get; init; } = string.Empty;
    public string Title { get; init; } = string.Empty;
    public string Description { get; init; } = string.Empty;
    public DateTime StartTime { get; init; }
    public DateTime EndTime { get; init; }
    public string? Location { get; init; }
    public string? MeetingLink { get; init; }
    public List<string> Attendees { get; init; } = [];
}

/// <summary>
/// Result of a calendar operation
/// </summary>
public record CalendarOperationResult
{
    public bool Success { get; init; }
    public string? ExternalEventId { get; init; }
    public string? Error { get; init; }

    public static CalendarOperationResult Succeeded(string? eventId = null) =>
        new() { Success = true, ExternalEventId = eventId };

    public static CalendarOperationResult Failed(string error) =>
        new() { Success = false, Error = error };
}

/// <summary>
/// OAuth token exchange result
/// </summary>
public record OAuthTokenResult
{
    public bool Success { get; init; }
    public string? AccessToken { get; init; }
    public string? RefreshToken { get; init; }
    public DateTime ExpiresAt { get; init; }
    public string? Email { get; init; }
    public string? Error { get; init; }

    public static OAuthTokenResult Succeeded(string accessToken, string refreshToken, DateTime expiresAt, string? email = null) =>
        new() { Success = true, AccessToken = accessToken, RefreshToken = refreshToken, ExpiresAt = expiresAt, Email = email };

    public static OAuthTokenResult Failed(string error) =>
        new() { Success = false, Error = error };
}

/// <summary>
/// Interface for calendar provider services (Google, Microsoft, Apple)
/// </summary>
public interface ICalendarService
{
    /// <summary>
    /// The provider name (Google, Microsoft, Apple)
    /// </summary>
    string Provider { get; }

    /// <summary>
    /// Whether this provider uses OAuth (Google, Microsoft) or CalDAV (Apple)
    /// </summary>
    bool UsesOAuth { get; }

    /// <summary>
    /// Generate OAuth authorization URL for user to grant access
    /// </summary>
    string GetAuthorizationUrl(string state, string redirectUri);

    /// <summary>
    /// Exchange authorization code for access and refresh tokens
    /// </summary>
    Task<OAuthTokenResult> ExchangeCodeForTokensAsync(string code, string redirectUri, CancellationToken cancellationToken = default);

    /// <summary>
    /// Refresh an expired access token using the refresh token
    /// </summary>
    Task<OAuthTokenResult> RefreshAccessTokenAsync(string refreshToken, CancellationToken cancellationToken = default);

    /// <summary>
    /// Revoke access (disconnect calendar)
    /// </summary>
    Task<bool> RevokeAccessAsync(string accessToken, CancellationToken cancellationToken = default);

    /// <summary>
    /// Create an event in the user's calendar
    /// </summary>
    Task<CalendarOperationResult> CreateEventAsync(string accessToken, CalendarAppointment appointment, string? calendarId = null, CancellationToken cancellationToken = default);

    /// <summary>
    /// Update an existing event
    /// </summary>
    Task<CalendarOperationResult> UpdateEventAsync(string accessToken, string externalEventId, CalendarAppointment appointment, string? calendarId = null, CancellationToken cancellationToken = default);

    /// <summary>
    /// Delete an event from the calendar
    /// </summary>
    Task<CalendarOperationResult> DeleteEventAsync(string accessToken, string externalEventId, string? calendarId = null, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get user's email from the calendar provider
    /// </summary>
    Task<string?> GetUserEmailAsync(string accessToken, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get busy time slots from the user's calendar within a date range
    /// </summary>
    /// <param name="accessToken">The access token (or credentials for CalDAV)</param>
    /// <param name="startTime">Start of the time range to check</param>
    /// <param name="endTime">End of the time range to check</param>
    /// <param name="calendarId">Optional calendar ID (defaults to primary)</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>List of busy time slots</returns>
    Task<BusyTimesResult> GetBusyTimesAsync(
        string accessToken,
        DateTime startTime,
        DateTime endTime,
        string? calendarId = null,
        CancellationToken cancellationToken = default);
}

/// <summary>
/// Factory for creating calendar service instances based on provider
/// </summary>
public interface ICalendarServiceFactory
{
    ICalendarService GetService(string provider);
    IEnumerable<string> GetSupportedProviders();
}
