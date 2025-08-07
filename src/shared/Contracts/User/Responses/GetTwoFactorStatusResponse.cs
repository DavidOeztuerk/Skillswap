namespace Contracts.User.Responses;

/// <summary>
/// API response for GetTwoFactorStatus operation
/// </summary>
public record GetTwoFactorStatusResponse(
    bool IsEnabled,
    bool HasSecret,
    DateTime? EnabledAt = null,
    List<string>? BackupCodes = null)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}
