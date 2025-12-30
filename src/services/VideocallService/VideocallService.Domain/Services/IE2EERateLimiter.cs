namespace VideocallService.Domain.Services;

/// <summary>
/// Rate Limiter for E2EE Operations
/// Uses Sliding Window algorithm for accurate rate limiting
/// </summary>
public interface IE2EERateLimiter
{
    /// <summary>
    /// Checks if an E2EE operation is allowed for the given user
    /// </summary>
    /// <param name="userId">User ID to check</param>
    /// <param name="operationType">Type of operation (KeyOffer, KeyAnswer, KeyRotation)</param>
    /// <returns>RateLimitResult with allowed status and remaining quota</returns>
    Task<RateLimitResult> CheckRateLimitAsync(string userId, string operationType);

    /// <summary>
    /// Records an E2EE operation for rate limiting
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <param name="operationType">Type of operation</param>
    Task RecordOperationAsync(string userId, string operationType);

    /// <summary>
    /// Gets current rate limit status for a user
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <param name="operationType">Type of operation</param>
    /// <returns>Current count and window info</returns>
    Task<RateLimitStatus> GetStatusAsync(string userId, string operationType);
}

/// <summary>
/// Result of a rate limit check
/// </summary>
public record RateLimitResult
{
    /// <summary>
    /// Whether the operation is allowed
    /// </summary>
    public bool IsAllowed { get; init; }

    /// <summary>
    /// Remaining operations allowed in current window
    /// </summary>
    public int RemainingOperations { get; init; }

    /// <summary>
    /// Seconds until the rate limit resets
    /// </summary>
    public int ResetInSeconds { get; init; }

    /// <summary>
    /// Current operation count in the window
    /// </summary>
    public int CurrentCount { get; init; }

    /// <summary>
    /// Maximum operations allowed per window
    /// </summary>
    public int MaxOperations { get; init; }

    public static RateLimitResult Allowed(int remaining, int current, int max, int resetIn) => new()
    {
        IsAllowed = true,
        RemainingOperations = remaining,
        CurrentCount = current,
        MaxOperations = max,
        ResetInSeconds = resetIn
    };

    public static RateLimitResult Denied(int current, int max, int resetIn) => new()
    {
        IsAllowed = false,
        RemainingOperations = 0,
        CurrentCount = current,
        MaxOperations = max,
        ResetInSeconds = resetIn
    };
}

/// <summary>
/// Current rate limit status
/// </summary>
public record RateLimitStatus
{
    public int CurrentCount { get; init; }
    public int MaxOperations { get; init; }
    public int WindowSizeSeconds { get; init; }
    public DateTime WindowStartTime { get; init; }
    public DateTime WindowEndTime { get; init; }
}
