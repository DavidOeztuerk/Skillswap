using CQRS.Interfaces;

namespace Events.Domain.VideoCall;

public record ParticipantLeftCallDomainEvent(
    string SessionId,
    string UserId,
    DateTime LeftAt,
    int SessionDurationMinutes) : DomainEvent;
