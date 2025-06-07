using CQRS.Interfaces;

namespace UserService.Domain.Events;

public record UserLoggedInDomainEvent(
    string UserId,
    string IpAddress,
    string? DeviceInfo) : DomainEvent;
