using CQRS.Interfaces;
using Contracts.UserService.Permissions;

namespace UserService.Application.Queries.Permissions;

/// <summary>
/// Query to get permissions for a user
/// </summary>
public record GetUserPermissionsQuery(string UserId) : IQuery<UserPermissionsResponse>;