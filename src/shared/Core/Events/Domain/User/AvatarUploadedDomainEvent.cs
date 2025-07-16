using CQRS.Interfaces;

namespace Events.Domain.User;

public record AvatarUploadedDomainEvent(
    string UserId,
    string Email,
    string AvatarUrl) : DomainEvent;
