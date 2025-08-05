namespace Contracts.User.Responses;

/// <summary>
/// API response for GetUserAvailability operation
/// </summary>
public record GetUserAvailabilityResponse(
    string UserId,
    bool IsAvailable,
    string? StatusMessage,
    DateTime LastUpdatedAt)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}
