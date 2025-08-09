using CQRS.Interfaces;
using CQRS.Models;

namespace UserService.Application.Queries.Permissions;

/// <summary>
/// Query to check if user has multiple permissions
/// </summary>
public record CheckMultiplePermissionsQuery(
    string UserId,
    List<string> PermissionNames,
    bool RequireAll = false) : IQuery<bool>;