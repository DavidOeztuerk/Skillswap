namespace Contracts.User.Responses;

/// <summary>
/// API response for RequestPasswordReset operation
/// </summary>
public record RequestPasswordResetResponse(
    bool Success,
    string Message)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}
