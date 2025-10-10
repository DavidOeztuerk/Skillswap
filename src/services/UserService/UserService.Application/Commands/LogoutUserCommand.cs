using Contracts.User.Responses.Auth;
using CQRS.Interfaces;

namespace UserService.Application.Commands;

public record LogoutUserCommand(string AccessToken) : ICommand<LogoutResponse>
{
    public string? UserId { get; set; }
}
