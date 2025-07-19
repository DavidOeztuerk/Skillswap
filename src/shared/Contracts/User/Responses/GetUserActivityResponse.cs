namespace Contracts.User.Responses;

/// <summary>
/// API response for GetUserActivity operation
/// </summary>
public record GetUserActivityResponse(
    // TODO: Add response properties
    string PlaceholderResult)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}
