using CQRS.Interfaces;

namespace VideocallService.Domain.Events;

public record CallSessionStartedDomainEvent(
    string SessionId,
    string RoomId,
    List<string> ParticipantIds,
    DateTime StartedAt) : DomainEvent;
