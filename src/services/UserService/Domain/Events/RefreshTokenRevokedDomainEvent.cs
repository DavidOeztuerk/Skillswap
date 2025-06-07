using CQRS.Interfaces;

namespace UserService.Domain.Events;

public record RefreshTokenRevokedDomainEvent(
    string UserId,
    string TokenId,
    string Reason) : DomainEvent;