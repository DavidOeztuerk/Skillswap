using CQRS.Interfaces;

namespace UserService.Application.Commands;

public class UpdateUserRoleCommand : ICommand<AdminUserResponse>
{
    public string? UserId { get; set; }
    public string? Role { get; set; }
}