using CQRS.Interfaces;

namespace Events.Domain.VideoCall;

public record ScreenShareStartedDomainEvent(
    string SessionId,
    string UserId) : DomainEvent;
