namespace Contracts.User.Responses;

/// <summary>
/// API response for ResetPassword operation
/// </summary>
public record ResetPasswordResponse(
    // TODO: Add response properties
    string PlaceholderResult)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}
