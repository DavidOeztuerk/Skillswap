using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using CQRS.Handlers;
using CQRS.Models;
using Microsoft.Extensions.Logging;
using UserService.Application.Queries;
using UserService.Domain.Repositories;

namespace UserService.Application.QueryHandlers;

public class GetUserRolesQueryHandler(
    IUserRepository userRepository,
    IPermissionRepository permissionRepository,
    ILogger<GetUserRolesQueryHandler> logger)
    : BaseQueryHandler<GetUserRolesQuery, UserRolesResponse>(logger)
{
    private readonly IUserRepository _users = userRepository;
    private readonly IPermissionRepository _perms = permissionRepository;

    public override async Task<ApiResponse<UserRolesResponse>> Handle(
        GetUserRolesQuery request,
        CancellationToken ct)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.UserId))
                return Error("UserId is required");

            var user = await _users.GetUserWithRoles(request.UserId, ct);
            if (user is null || user.IsDeleted)
                return NotFound("User not found");

            var roles = user.UserRoles
                .Where(ur => ur.RevokedAt == null)
                .Select(ur => ur.Role.Name)
                .Distinct()
                .ToList();

            // hol aus DB (inkl. Rollen-Inheritance & direkte User-Permissions)
            var permissionNames = await _perms.GetUserPermissionNamesAsync(user.Id, ct);
            var response = new UserRolesResponse(
                user.Id,
                roles,
                permissionNames.Distinct().OrderBy(x => x).ToList());

            Logger.LogInformation("Retrieved roles & permissions for user {UserId}", request.UserId);
            return Success(response);
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error retrieving roles for user {UserId}", request.UserId);
            return Error("An error occurred while retrieving user roles");
        }
    }
}
