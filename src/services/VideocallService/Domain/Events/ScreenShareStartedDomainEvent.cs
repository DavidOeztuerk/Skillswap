using CQRS.Interfaces;

namespace VideocallService.Domain.Events;

public record ScreenShareStartedDomainEvent(
    string SessionId,
    string UserId) : DomainEvent;
