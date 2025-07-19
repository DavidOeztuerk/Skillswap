namespace Contracts.User.Responses;

/// <summary>
/// API response for VerifyTwoFactorCode operation
/// </summary>
public record VerifyTwoFactorCodeResponse(
    // TODO: Add response properties
    string PlaceholderResult)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}
