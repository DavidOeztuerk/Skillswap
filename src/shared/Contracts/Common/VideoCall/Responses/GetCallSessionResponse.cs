namespace Contracts.VideoCall.Responses;

/// <summary>
/// API response for GetCallSession operation
/// </summary>
public record GetCallSessionResponse(
    // TODO: Add response properties
    string PlaceholderResult)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}
