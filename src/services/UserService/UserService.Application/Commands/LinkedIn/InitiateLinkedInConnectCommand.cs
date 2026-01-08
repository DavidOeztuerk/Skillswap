using Contracts.User.Responses.LinkedIn;
using CQRS.Interfaces;

namespace UserService.Application.Commands.LinkedIn;

/// <summary>
/// Command to initiate LinkedIn connection - generates OAuth 2.0 URL
/// Phase 12: LinkedIn/Xing Integration
/// </summary>
public record InitiateLinkedInConnectCommand(
    string RedirectUri) : ICommand<InitiateLinkedInConnectResponse>, IAuditableCommand
{
    public string? UserId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}
