using CQRS.Interfaces;

namespace VideocallService.Application.Queries;

public record GetCallSessionQuery(
    string SessionId) : IQuery<CallSessionResponse>, ICacheableQuery
{
    public string CacheKey => $"call-session:{SessionId}";
    public TimeSpan CacheDuration => TimeSpan.FromMinutes(1);
}

public record CallSessionResponse(
    string SessionId,
    string RoomId,
    string InitiatorUserId,
    string InitiatorName,
    string ParticipantUserId,
    string ParticipantName,
    string Status,
    DateTime? StartedAt,
    DateTime? EndedAt,
    int? DurationMinutes,
    List<CallParticipantResponse> ActiveParticipants,
    bool IsRecorded,
    string? RecordingUrl);

public record CallParticipantResponse(
    string UserId,
    string UserName,
    string ConnectionId,
    DateTime JoinedAt,
    bool CameraEnabled,
    bool MicrophoneEnabled,
    bool ScreenShareEnabled);
