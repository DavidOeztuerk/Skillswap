using CQRS.Interfaces;

namespace UserService.Application.Commands.Favorites;

public record AddFavoriteSkillCommand(
    string SkillId) 
    : ICommand<bool>, IAuditableCommand
{
    public string? UserId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}
