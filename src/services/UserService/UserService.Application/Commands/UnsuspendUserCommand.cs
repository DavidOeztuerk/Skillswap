using CQRS.Interfaces;

namespace UserService.Application.Commands;

public class UnsuspendUserCommand : ICommand<AdminUserResponse>
{
    public string? UserId { get; set; }
}