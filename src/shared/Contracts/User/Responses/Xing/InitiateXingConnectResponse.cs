namespace Contracts.User.Responses.Xing;

/// <summary>
/// Response containing the OAuth 1.0a authorization URL for Xing
/// Phase 12: LinkedIn/Xing Integration
/// Note: OAuth 1.0a requires a request token before authorization
/// </summary>
public record InitiateXingConnectResponse(
    string AuthorizationUrl,
    string State,
    string RequestToken);
