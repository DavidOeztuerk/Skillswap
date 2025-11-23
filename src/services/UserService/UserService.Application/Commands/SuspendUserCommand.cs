using CQRS.Interfaces;

namespace UserService.Application.Commands;

public class SuspendUserCommand : ICommand<AdminUserResponse>, IAuditableCommand, ICacheInvalidatingCommand
{
    public string? UserId { get; set; }
    public string? Reason { get; set; }

    public string[] InvalidationPatterns =>
    [
        "user-profile:{UserId}:*",
        "public-profile:{UserId}:*"
    ];

    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}