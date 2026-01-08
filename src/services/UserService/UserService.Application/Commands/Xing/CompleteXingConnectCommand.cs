using Contracts.User.Responses.Xing;
using CQRS.Interfaces;

namespace UserService.Application.Commands.Xing;

/// <summary>
/// Command to complete Xing connection - exchanges OAuth 1.0a verifier for tokens
/// Phase 12: LinkedIn/Xing Integration
/// Note: OAuth 1.0a uses oauth_verifier instead of code
/// </summary>
public record CompleteXingConnectCommand(
    string OAuthToken,
    string OAuthVerifier,
    string State) : ICommand<XingConnectionResponse>, ICacheInvalidatingCommand
{
    // UserId wird aus dem State-Token extrahiert
    public string[] InvalidationPatterns =>
    [
        "xing-connection:*"
    ];
}
