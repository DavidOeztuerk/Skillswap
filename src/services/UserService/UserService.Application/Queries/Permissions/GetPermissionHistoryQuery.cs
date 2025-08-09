using CQRS.Interfaces;
using Contracts.UserService.Permissions;

namespace UserService.Application.Queries.Permissions;

/// <summary>
/// Query to get permission history for a user
/// </summary>
public record GetPermissionHistoryQuery(string UserId) : IQuery<PermissionHistoryResponse>;