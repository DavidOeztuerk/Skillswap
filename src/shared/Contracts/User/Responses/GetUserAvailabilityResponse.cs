namespace Contracts.User.Responses;

/// <summary>
/// API response for GetUserAvailability operation
/// </summary>
public record GetUserAvailabilityResponse(
    // TODO: Add response properties
    string PlaceholderResult)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}
