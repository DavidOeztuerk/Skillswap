namespace Contracts.VideoCall.Responses;

/// <summary>
/// API response for JoinCall operation
/// </summary>
public record JoinCallResponse(
    string SessionId,
    string RoomId,
    bool Success,
    List<string> OtherParticipants)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}
