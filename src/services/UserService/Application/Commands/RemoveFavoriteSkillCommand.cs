using CQRS.Interfaces;

namespace UserService.Application.Commands.Favorites;

public record RemoveFavoriteSkillCommand(
    string SkillId) 
    : ICommand<bool>, IAuditableCommand
{
    public string? UserId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}
