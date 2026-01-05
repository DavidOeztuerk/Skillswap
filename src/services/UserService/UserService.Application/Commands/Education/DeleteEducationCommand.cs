using CQRS.Interfaces;

namespace UserService.Application.Commands.Education;

public record DeleteEducationCommand(string EducationId) : ICommand<bool>, IAuditableCommand, ICacheInvalidatingCommand
{
    public string? UserId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    public string[] InvalidationPatterns =>
    [
        $"user-profile:{UserId}:*",
        $"public-profile:{UserId}:*",
        $"user-education:{UserId}:*"
    ];
}
