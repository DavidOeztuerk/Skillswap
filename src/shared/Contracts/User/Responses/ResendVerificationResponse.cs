namespace Contracts.User.Responses;

/// <summary>
/// API response for ResendVerification operation
/// </summary>
public record ResendVerificationResponse(
    bool Success,
    string Message)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}
