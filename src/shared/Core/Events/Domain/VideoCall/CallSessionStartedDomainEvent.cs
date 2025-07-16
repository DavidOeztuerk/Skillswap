using CQRS.Interfaces;

namespace Events.Domain.VideoCall;

public record CallSessionStartedDomainEvent(
    string SessionId,
    string RoomId,
    List<string> ParticipantIds,
    DateTime StartedAt) : DomainEvent;
