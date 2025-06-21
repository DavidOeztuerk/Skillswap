using CQRS.Interfaces;

namespace VideocallService.Domain.Events;

public record ParticipantJoinedCallDomainEvent(
    string SessionId,
    string UserId,
    string ConnectionId,
    DateTime JoinedAt) : DomainEvent;
