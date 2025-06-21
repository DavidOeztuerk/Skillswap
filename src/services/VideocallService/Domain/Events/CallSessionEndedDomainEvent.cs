using CQRS.Interfaces;

namespace VideocallService.Domain.Events;

public record CallSessionEndedDomainEvent(
    string SessionId,
    string RoomId,
    List<string> ParticipantIds,
    DateTime EndedAt,
    int DurationMinutes,
    string? EndReason) : DomainEvent;
