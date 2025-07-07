using CQRS.Interfaces;

namespace UserService.Domain.Events;

public record AvatarUploadedDomainEvent(
    string UserId,
    string Email,
    string AvatarUrl) : DomainEvent;
