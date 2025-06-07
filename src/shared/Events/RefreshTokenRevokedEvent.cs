namespace Events;

public record RefreshTokenRevokedEvent(
    string UserId,
    string TokenId,
    string Reason);
