namespace Contracts.User.Responses;

/// <summary>
/// API response for DisableTwoFactor operation
/// </summary>
public record DisableTwoFactorResponse(
    bool Success,
    string Message)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}
