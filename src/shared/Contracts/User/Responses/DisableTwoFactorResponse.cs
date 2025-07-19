namespace Contracts.User.Responses;

/// <summary>
/// API response for DisableTwoFactor operation
/// </summary>
public record DisableTwoFactorResponse(
    // TODO: Add response properties
    string PlaceholderResult)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}
