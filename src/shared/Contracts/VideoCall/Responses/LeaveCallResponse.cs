namespace Contracts.VideoCall.Responses;

/// <summary>
/// API response for LeaveCall operation
/// </summary>
public record LeaveCallResponse(
    string SessionId,
    bool Success)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}
