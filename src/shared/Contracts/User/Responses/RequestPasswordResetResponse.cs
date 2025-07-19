namespace Contracts.User.Responses;

/// <summary>
/// API response for RequestPasswordReset operation
/// </summary>
public record RequestPasswordResetResponse(
    // TODO: Add response properties
    string PlaceholderResult)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}
