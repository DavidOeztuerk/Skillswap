using CQRS.Interfaces;
using UserService.Application.Commands;

namespace UserService.Application.Queries;

public class GetAdminDashboardQuery : IQuery<AdminDashboardResponse>
{
}