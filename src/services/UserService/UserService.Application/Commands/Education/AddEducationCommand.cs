using Contracts.User.Responses;
using CQRS.Interfaces;

namespace UserService.Application.Commands.Education;

public record AddEducationCommand(
    string Degree,
    string Institution,
    int? GraduationYear,
    int? GraduationMonth,
    string? Description,
    int SortOrder = 0) : ICommand<UserEducationResponse>, IAuditableCommand, ICacheInvalidatingCommand
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
