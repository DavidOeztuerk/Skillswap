using CQRS.Interfaces;
using UserService.Application.Commands;

namespace UserService.Application.Queries;

public class GetAdminUserByIdQuery : IQuery<AdminUserResponse>
{
    public string? UserId { get; set; }
}