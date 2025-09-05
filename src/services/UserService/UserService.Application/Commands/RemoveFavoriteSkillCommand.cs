using CQRS.Interfaces;

namespace UserService.Application.Commands;

public record RemoveFavoriteSkillCommand(
    string SkillId) 
    : ICommand<bool>, IAuditableCommand, ICacheInvalidatingCommand
{
    public string? UserId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    public string[] InvalidationPatterns => new[]
    {
        "favorite-skills:*"
    };
}
