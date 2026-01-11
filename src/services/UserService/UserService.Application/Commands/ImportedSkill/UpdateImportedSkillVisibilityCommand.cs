using Contracts.User.Responses;
using CQRS.Interfaces;

namespace UserService.Application.Commands.ImportedSkill;

/// <summary>
/// Command to update skill visibility
/// </summary>
public record UpdateImportedSkillVisibilityCommand(
    string SkillId,
    bool IsVisible) : ICommand<UserImportedSkillResponse>, IAuditableCommand, ICacheInvalidatingCommand
{
  public string? UserId { get; set; }
  public DateTime Timestamp { get; set; } = DateTime.UtcNow;

  public string[] InvalidationPatterns =>
  [
      $"imported-skills:{UserId}:*",
        $"social-connections:{UserId}"
  ];
}
