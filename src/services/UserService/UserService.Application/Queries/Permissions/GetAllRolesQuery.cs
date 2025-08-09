using CQRS.Interfaces;
using Contracts.UserService.Permissions;

namespace UserService.Application.Queries.Permissions;

/// <summary>
/// Query to get all available roles
/// </summary>
public record GetAllRolesQuery() : IQuery<List<RoleDto>>;