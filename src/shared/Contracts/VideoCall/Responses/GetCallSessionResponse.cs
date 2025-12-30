namespace Contracts.VideoCall.Responses;

/// <summary>
/// API response for GetCallSession operation
/// </summary>
public record GetCallSessionResponse(
    string SessionId,
    string RoomId,
    string InitiatorUserId,
    string InitiatorName,
    string? InitiatorAvatarUrl,
    string ParticipantUserId,
    string ParticipantName,
    string? ParticipantAvatarUrl,
    string Status,
    DateTime? StartedAt,
    DateTime? EndedAt,
    int? DurationMinutes,
    List<CallParticipantResponse> Participants,
    bool IsRecorded,
    string? RecordingUrl,
    string? ThreadId)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}

/// <summary>
/// Response for a call participant
/// </summary>
public record CallParticipantResponse(
    string UserId,
    string Name,
    string? ConnectionId,
    DateTime JoinedAt,
    bool CameraEnabled,
    bool MicrophoneEnabled,
    bool ScreenShareEnabled);
