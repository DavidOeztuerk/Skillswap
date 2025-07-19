namespace Contracts.VideoCall.Responses;

/// <summary>
/// API response for EndCall operation
/// </summary>
public record EndCallResponse(
    // TODO: Add response properties
    string PlaceholderResult)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}
