using CQRS.Interfaces;

namespace UserService.Application.Commands.Experience;

public record DeleteExperienceCommand(string ExperienceId) : ICommand<bool>, IAuditableCommand, ICacheInvalidatingCommand
{
    public string? UserId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    public string[] InvalidationPatterns =>
    [
        $"user-profile:{UserId}:*",
        $"public-profile:{UserId}:*",
        $"user-experience:{UserId}:*"
    ];
}
