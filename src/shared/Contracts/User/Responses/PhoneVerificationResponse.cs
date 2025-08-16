namespace Contracts.User.Responses;

/// <summary>
/// API response for phone verification operations
/// </summary>
public record PhoneVerificationResponse(
    bool Success,
    string Message)
{
    public DateTime? CooldownUntil { get; init; }
    public int AttemptsRemaining { get; init; }
    public DateTime? ExpiresAt { get; init; }
    public string? MaskedPhoneNumber { get; init; }
    
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}