using CQRS.Interfaces;

namespace UserService.Application.Commands;

public class DeleteUserCommand : ICommand<object>, IAuditableCommand, ICacheInvalidatingCommand
{
    public string? UserId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    public string[] InvalidationPatterns => new[]
    {
        "user-profile:*",
        "public-profile:*",
        "user-statistics:*",
        "favorite-skills:*",
        "blocked-users:*",
        "user-availability:*"
    };
}