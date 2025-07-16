using CQRS.Interfaces;

namespace Events.Domain.VideoCall;

public record ScreenShareEndedDomainEvent(
    string SessionId,
    string UserId) : DomainEvent;
