using CQRS.Interfaces;
using UserService.Application.Commands;

namespace UserService.Application.Queries;

public class GetAdminSettingsQuery : IQuery<AdminSettingsResponse>
{
}