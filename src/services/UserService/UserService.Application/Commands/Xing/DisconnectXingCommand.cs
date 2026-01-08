using CQRS.Interfaces;

namespace UserService.Application.Commands.Xing;

/// <summary>
/// Command to disconnect Xing account and optionally remove imported data
/// Phase 12: LinkedIn/Xing Integration
/// </summary>
public record DisconnectXingCommand(
    bool RemoveImportedData = false) : ICommand<bool>, IAuditableCommand, ICacheInvalidatingCommand
{
    public string? UserId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    public string[] InvalidationPatterns =>
    [
        $"user-profile:{UserId}:*",
        $"user-experience:{UserId}:*",
        $"user-education:{UserId}:*",
        $"xing-connection:{UserId}:*"
    ];
}
