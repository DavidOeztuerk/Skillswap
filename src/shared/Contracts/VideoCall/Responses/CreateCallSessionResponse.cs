namespace Contracts.VideoCall.Responses;

/// <summary>
/// API response for CreateCallSession operation
/// </summary>
public record CreateCallSessionResponse(
    // TODO: Add response properties
    string PlaceholderResult)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}
