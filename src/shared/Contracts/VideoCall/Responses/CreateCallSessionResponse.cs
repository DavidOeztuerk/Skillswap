namespace Contracts.VideoCall.Responses;

/// <summary>
/// API response for CreateCallSession operation
/// </summary>
public record CreateCallSessionResponse(
    string SessionId,
    string RoomId,
    string Status,
    DateTime CreatedAt,
    string InitiatorUserId,
    string ParticipantUserId,
    string? AppointmentId)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}
