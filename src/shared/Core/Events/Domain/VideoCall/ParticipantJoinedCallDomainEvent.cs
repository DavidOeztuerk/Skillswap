using CQRS.Interfaces;

namespace Events.Domain.VideoCall;

public record ParticipantJoinedCallDomainEvent(
    string SessionId,
    string UserId,
    string ConnectionId,
    DateTime JoinedAt) : DomainEvent;
