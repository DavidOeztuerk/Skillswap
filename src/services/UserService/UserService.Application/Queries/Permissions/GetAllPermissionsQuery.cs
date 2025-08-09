using CQRS.Interfaces;
using Contracts.UserService.Permissions;

namespace UserService.Application.Queries.Permissions;

/// <summary>
/// Query to get all available permissions
/// </summary>
public record GetAllPermissionsQuery() : IQuery<List<PermissionDto>>;