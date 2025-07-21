namespace Contracts.User.Responses;

/// <summary>
/// API response for VerifyEmail operation
/// </summary>
public record VerifyEmailResponse(
    bool Success,
    string Message)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}
