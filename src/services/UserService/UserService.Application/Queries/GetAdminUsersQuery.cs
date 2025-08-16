using CQRS.Interfaces;
using UserService.Application.Commands;

namespace UserService.Application.Queries;

public class GetAdminUsersQuery : IPagedQuery<AdminUserResponse>
{
    public string? Status { get; set; }
    public string? Role { get; set; }
    public string? Search { get; set; }
    public int PageNumber { get; set; }
    public int PageSize { get; set; }

}