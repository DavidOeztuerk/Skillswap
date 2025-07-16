namespace Events.Security.Authentication;

public record RefreshTokenRevokedEvent(
    string UserId,
    string TokenId,
    string Reason);
