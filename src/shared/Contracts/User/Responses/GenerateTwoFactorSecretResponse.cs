namespace Contracts.User.Responses;

/// <summary>
/// API response for GenerateTwoFactorSecret operation
/// </summary>
public record GenerateTwoFactorSecretResponse(
    // TODO: Add response properties
    string PlaceholderResult)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}
