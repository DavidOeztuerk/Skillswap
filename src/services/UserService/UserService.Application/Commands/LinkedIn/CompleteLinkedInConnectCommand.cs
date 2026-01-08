using Contracts.User.Responses.LinkedIn;
using CQRS.Interfaces;

namespace UserService.Application.Commands.LinkedIn;

/// <summary>
/// Command to complete LinkedIn connection - exchanges OAuth 2.0 code for tokens
/// Phase 12: LinkedIn/Xing Integration
/// </summary>
public record CompleteLinkedInConnectCommand(
    string Code,
    string State,
    string RedirectUri) : ICommand<LinkedInConnectionResponse>, ICacheInvalidatingCommand
{
    // UserId wird aus dem State-Token extrahiert
    public string[] InvalidationPatterns =>
    [
        "linkedin-connection:*"
    ];
}
