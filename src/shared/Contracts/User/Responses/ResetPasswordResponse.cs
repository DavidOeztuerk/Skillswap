namespace Contracts.User.Responses;

/// <summary>
/// API response for ResetPassword operation
/// </summary>
public record ResetPasswordResponse(
    bool Success,
    string Message)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}
