using CQRS.Interfaces;

namespace Events.Domain.VideoCall;

public record CallSessionEndedDomainEvent(
    string SessionId,
    string RoomId,
    List<string> ParticipantIds,
    DateTime EndedAt,
    int DurationMinutes,
    string? EndReason) : DomainEvent;
