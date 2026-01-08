namespace Contracts.User.Responses.LinkedIn;

/// <summary>
/// Response containing the OAuth 2.0 authorization URL for LinkedIn
/// Phase 12: LinkedIn/Xing Integration
/// </summary>
public record InitiateLinkedInConnectResponse(
    string AuthorizationUrl,
    string State);
