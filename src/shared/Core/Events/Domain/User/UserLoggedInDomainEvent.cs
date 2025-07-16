using CQRS.Interfaces;

namespace Events.Domain.User;

public record UserLoggedInDomainEvent(
    string UserId,
    string IpAddress,
    string? DeviceInfo) : DomainEvent;
