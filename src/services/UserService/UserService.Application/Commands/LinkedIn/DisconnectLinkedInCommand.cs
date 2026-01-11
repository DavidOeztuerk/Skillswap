using CQRS.Interfaces;

namespace UserService.Application.Commands.LinkedIn;

/// <summary>
/// Command to disconnect LinkedIn account and optionally remove imported data
/// </summary>
public record DisconnectLinkedInCommand(
    bool RemoveImportedData = false) : ICommand<bool>, IAuditableCommand, ICacheInvalidatingCommand
{
  public string? UserId { get; set; }
  public DateTime Timestamp { get; set; } = DateTime.UtcNow;

  public string[] InvalidationPatterns =>
  [
      $"user-profile:{UserId}:*",
        $"user-experience:{UserId}:*",
        $"user-education:{UserId}:*",
        $"linkedin-connection:{UserId}:*",
        $"social-connections:{UserId}"
  ];
}
