namespace Contracts.VideoCall.Responses;

/// <summary>
/// API response for StartCall operation
/// </summary>
public record StartCallResponse(
    string SessionId,
    DateTime StartedAt)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}
