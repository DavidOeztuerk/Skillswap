using CQRS.Interfaces;
using Contracts.Admin.Responses;

namespace UserService.Application.Commands;

public class MarkAlertAsReadCommand : ICommand<SecurityAlertActionResponse>, IAuditableCommand, ICacheInvalidatingCommand
{
    public string AlertId { get; set; } = string.Empty;
    public string AdminUserId { get; set; } = string.Empty;

    public string[] InvalidationPatterns =>
    [
        "security:alerts:*",
        "security:alerts:stats"
    ];

    // IAuditableCommand properties
    public string? UserId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}
