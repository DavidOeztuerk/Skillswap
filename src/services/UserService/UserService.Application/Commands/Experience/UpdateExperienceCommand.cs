using Contracts.User.Responses;
using CQRS.Interfaces;

namespace UserService.Application.Commands.Experience;

public record UpdateExperienceCommand(
    string ExperienceId,
    string Title,
    string Company,
    DateTime StartDate,
    DateTime? EndDate,
    string? Description,
    int SortOrder) : ICommand<UserExperienceResponse>, IAuditableCommand, ICacheInvalidatingCommand
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
