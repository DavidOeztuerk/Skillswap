namespace Contracts.VideoCall.Responses;

/// <summary>
/// API response for JoinCall operation
/// </summary>
public record JoinCallResponse(
    string SessionId,
    bool Success)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}
