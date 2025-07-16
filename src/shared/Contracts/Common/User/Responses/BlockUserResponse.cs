namespace Contracts.User.Responses;

/// <summary>
/// API response for BlockUser operation
/// </summary>
public record BlockUserResponse(
    // TODO: Add response properties
    string PlaceholderResult)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}
