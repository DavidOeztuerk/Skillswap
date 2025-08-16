using CQRS.Interfaces;

namespace UserService.Application.Commands;

public class SuspendUserCommand : ICommand<AdminUserResponse>
{
    public string? UserId { get; set; }
    public string? Reason { get; set; }
}