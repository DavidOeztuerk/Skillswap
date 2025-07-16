namespace Contracts.VideoCall.Responses;

/// <summary>
/// API response for JoinCall operation
/// </summary>
public record JoinCallResponse(
    // TODO: Add response properties
    string PlaceholderResult)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}
