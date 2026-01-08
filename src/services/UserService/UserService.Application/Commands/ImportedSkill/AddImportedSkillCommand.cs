using Contracts.User.Responses;
using CQRS.Interfaces;

namespace UserService.Application.Commands.ImportedSkill;

/// <summary>
/// Command to add a new manual imported skill
/// Phase 12: LinkedIn/Xing Integration
/// </summary>
public record AddImportedSkillCommand(
    string Name,
    string? Category = null,
    int SortOrder = 0) : ICommand<UserImportedSkillResponse>, IAuditableCommand, ICacheInvalidatingCommand
{
    public string? UserId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    public string[] InvalidationPatterns =>
    [
        $"imported-skills:{UserId}:*",
        $"social-connections:{UserId}:*"
    ];
}
