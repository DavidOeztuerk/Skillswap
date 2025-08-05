namespace Contracts.User.Responses;

/// <summary>
/// API response for UpdateUserStatus operation
/// </summary>
public record UpdateUserStatusResponse(
    string UserId,
    string NewStatus,
    DateTime UpdatedAt)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}
