namespace Contracts.VideoCall.Responses;

/// <summary>
/// API response for GetCallSession operation
/// </summary>
public record GetCallSessionResponse(
    string SessionId,
    string AppointmentId,
    string Status,
    List<string> ParticipantUserIds,
    DateTime CreatedAt,
    DateTime? StartedAt,
    DateTime? EndedAt)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}
