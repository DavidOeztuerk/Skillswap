using CQRS.Interfaces;

namespace VideocallService.Domain.Events;

public record ScreenShareEndedDomainEvent(
    string SessionId,
    string UserId) : DomainEvent;
