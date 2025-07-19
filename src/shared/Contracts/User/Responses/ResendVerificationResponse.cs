namespace Contracts.User.Responses;

/// <summary>
/// API response for ResendVerification operation
/// </summary>
public record ResendVerificationResponse(
    // TODO: Add response properties
    string PlaceholderResult)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}
