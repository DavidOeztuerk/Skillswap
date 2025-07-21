namespace Contracts.User.Responses;

/// <summary>
/// API response for VerifyTwoFactorCode operation
/// </summary>
public record VerifyTwoFactorCodeResponse(
    bool Success)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}
