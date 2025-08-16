using CQRS.Interfaces;

namespace UserService.Application.Commands;

public class DeleteUserCommand : ICommand<object>
{
    public string? UserId { get; set; }
}