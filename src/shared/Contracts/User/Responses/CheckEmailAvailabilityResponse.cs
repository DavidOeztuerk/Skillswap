namespace Contracts.User.Responses;

/// <summary>
/// API response for CheckEmailAvailability operation
/// </summary>
public record CheckEmailAvailabilityResponse(
    string Email,
    bool IsAvailable,
    string? Suggestion)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}
