using CQRS.Interfaces;

namespace Events.Domain.User;

public record RefreshTokenRevokedDomainEvent(
    string UserId,
    string TokenId,
    string Reason) : DomainEvent;