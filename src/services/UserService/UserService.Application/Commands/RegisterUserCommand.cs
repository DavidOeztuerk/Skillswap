using CQRS.Interfaces;
using Contracts.User.Responses.Auth;

namespace UserService.Application.Commands;

public record RegisterUserCommand(
    string Email,
    string Password,
    string FirstName,
    string LastName,
    string UserName)
    : ICommand<RegisterResponse>, IAuditableCommand, ICacheInvalidatingCommand
{
    public string? UserId { get; set; }

    public string[] InvalidationPatterns =>
    [
        "user-profile:*",
        "public-profile:*",
        "users:*"
    ];

    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}
