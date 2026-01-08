using Contracts.User.Responses;
using CQRS.Interfaces;

namespace UserService.Application.Commands.ImportedSkill;

/// <summary>
/// Command to update an imported skill
/// Phase 12: LinkedIn/Xing Integration
/// </summary>
public record UpdateImportedSkillCommand(
    string SkillId,
    string Name,
    string? Category,
    int SortOrder,
    bool IsVisible) : ICommand<UserImportedSkillResponse>, IAuditableCommand, ICacheInvalidatingCommand
{
    public string? UserId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    public string[] InvalidationPatterns =>
    [
        $"imported-skills:{UserId}:*",
        $"social-connections:{UserId}:*"
    ];
}
