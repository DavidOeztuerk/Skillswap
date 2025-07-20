namespace Contracts.User.Responses;

/// <summary>
/// API response for token validation
/// </summary>
public record ValidateTokenResponse(
    bool IsValid,
    string? UserId,
    List<string> Roles,
    List<string> Permissions,
    DateTime? ExpiresAt,
    string? FailureReason = null)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}