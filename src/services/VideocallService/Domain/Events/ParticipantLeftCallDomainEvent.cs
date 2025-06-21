using CQRS.Interfaces;

namespace VideocallService.Domain.Events;

public record ParticipantLeftCallDomainEvent(
    string SessionId,
    string UserId,
    DateTime LeftAt,
    int SessionDurationMinutes) : DomainEvent;
