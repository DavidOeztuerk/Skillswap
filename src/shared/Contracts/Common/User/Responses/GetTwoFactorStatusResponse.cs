namespace Contracts.User.Responses;

/// <summary>
/// API response for GetTwoFactorStatus operation
/// </summary>
public record GetTwoFactorStatusResponse(
    // TODO: Add response properties
    string PlaceholderResult)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}
