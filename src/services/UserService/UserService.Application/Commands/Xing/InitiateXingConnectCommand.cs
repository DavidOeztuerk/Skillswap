using Contracts.User.Responses.Xing;
using CQRS.Interfaces;

namespace UserService.Application.Commands.Xing;

/// <summary>
/// Command to initiate Xing connection - generates OAuth 1.0a URL
/// </summary>
public record InitiateXingConnectCommand(
    string RedirectUri) : ICommand<InitiateXingConnectResponse>, IAuditableCommand
{
  public string? UserId { get; set; }
  public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}
