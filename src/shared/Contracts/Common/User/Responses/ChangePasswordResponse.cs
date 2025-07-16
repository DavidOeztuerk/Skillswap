namespace Contracts.User.Responses;

/// <summary>
/// API response for password change operation
/// </summary>
/// <param name="Success">Whether the password change was successful</param>
/// <param name="Message">Success or error message</param>
public record ChangePasswordResponse(
    bool Success,
    string Message)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}
