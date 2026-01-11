using Contracts.User.Requests;
using CQRS.Interfaces;

namespace UserService.Application.Commands.ImportedSkill;

/// <summary>
/// Command to reorder imported skills
/// </summary>
public record ReorderImportedSkillsCommand(
    List<SkillOrderItem> Skills) : ICommand<bool>, IAuditableCommand, ICacheInvalidatingCommand
{
  public string? UserId { get; set; }
  public DateTime Timestamp { get; set; } = DateTime.UtcNow;

  public string[] InvalidationPatterns =>
  [
      $"imported-skills:{UserId}:*",
        $"social-connections:{UserId}"
  ];
}
