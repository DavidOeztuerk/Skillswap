using CQRS.Interfaces;
using CQRS.Models;

namespace UserService.Application.Queries.Permissions;

/// <summary>
/// Query to check if user has a specific permission
/// </summary>
public record CheckPermissionQuery(
    string UserId,
    string PermissionName,
    string? ResourceId = null) : IQuery<bool>;