namespace Contracts.User.Responses;

/// <summary>
/// API response for verify phone operation
/// </summary>
public record VerifyPhoneResponse(
    bool Success,
    string Message)
{
    public bool PhoneVerified { get; init; }
    public string? PhoneNumber { get; init; }
    
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}