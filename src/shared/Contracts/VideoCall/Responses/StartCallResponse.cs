namespace Contracts.VideoCall.Responses;

/// <summary>
/// API response for StartCall operation
/// </summary>
public record StartCallResponse(
    // TODO: Add response properties
    string PlaceholderResult)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}
