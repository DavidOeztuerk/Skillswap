namespace Contracts.User.Responses;

/// <summary>
/// API response for UpdateUserAvailability operation
/// </summary>
public record UpdateUserAvailabilityResponse(
    string UserId,
    bool IsAvailable,
    DateTime UpdatedAt)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}
