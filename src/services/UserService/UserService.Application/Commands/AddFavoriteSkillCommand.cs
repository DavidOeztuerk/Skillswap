using CQRS.Interfaces;

namespace UserService.Application.Commands;

/// <summary>
/// Command to add a skill to a user favorite list
/// </summary>
/// <param name="UserId">The ID of the skill to add to the user favorte list</param>
public record AddFavoriteSkillCommand(
    string SkillId)
    : ICommand<bool>, IAuditableCommand
{
    public string? UserId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}
