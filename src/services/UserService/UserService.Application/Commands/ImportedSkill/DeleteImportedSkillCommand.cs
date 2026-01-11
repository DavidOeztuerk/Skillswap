using CQRS.Interfaces;

namespace UserService.Application.Commands.ImportedSkill;

/// <summary>
/// Command to delete an imported skill
/// </summary>
public record DeleteImportedSkillCommand(
    string SkillId) : ICommand<bool>, IAuditableCommand, ICacheInvalidatingCommand
{
  public string? UserId { get; set; }
  public DateTime Timestamp { get; set; } = DateTime.UtcNow;

  public string[] InvalidationPatterns =>
  [
      $"imported-skills:{UserId}:*",
        $"social-connections:{UserId}"
  ];
}
