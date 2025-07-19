namespace Contracts.VideoCall.Responses;

/// <summary>
/// API response for LeaveCall operation
/// </summary>
public record LeaveCallResponse(
    // TODO: Add response properties
    string PlaceholderResult)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}
