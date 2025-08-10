using CQRS.Handlers;
using CQRS.Models;
using Microsoft.Extensions.Logging;
using UserService.Application.Queries;
using UserService.Domain.Repositories;

namespace UserService.Application.QueryHandlers;

public class GetUserRolesQueryHandler(
    IUserRepository userRepository,
    ILogger<GetUserRolesQueryHandler> logger) 
    : BaseQueryHandler<GetUserRolesQuery, UserRolesResponse>(logger)
{
    private readonly IUserRepository _userRepository = userRepository;

    public override async Task<ApiResponse<UserRolesResponse>> Handle(
        GetUserRolesQuery request, 
        CancellationToken cancellationToken)
    {
        try
        {
            var user = await _userRepository.GetUserWithRoles(request.UserId, cancellationToken);

            if (user == null || user.IsDeleted)
            {
                return NotFound("User not found");
            }

            var roles = user.UserRoles.Select(ur => ur.Role).ToList();
            
            // Map roles to permissions (simplified - in real app this would be from a permissions table)
            var permissions = new List<string>();
            foreach (var role in roles)
            {
                permissions.AddRange(GetPermissionsForRole(role));
            }

            var response = new UserRolesResponse(
                user.Id,
                roles,
                permissions.Distinct().ToList());

            Logger.LogInformation("Retrieved roles for user {UserId}", request.UserId);
            return Success(response);
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error retrieving roles for user {UserId}", request.UserId);
            return Error("An error occurred while retrieving user roles");
        }
    }

    private static List<string> GetPermissionsForRole(string role)
    {
        return role switch
        {
            "SuperAdmin" => new List<string>
            {
                "users:read", "users:write", "users:delete", "users:manage_roles",
                "skills:read", "skills:write", "skills:delete", "skills:manage_categories",
                "matching:access", "matching:view_all",
                "appointments:read", "appointments:write", "appointments:delete",
                "videocalls:access", "videocalls:manage",
                "system:admin_panel", "system:logs", "system:manage"
            },
            "Admin" => new List<string>
            {
                "users:read", "users:write", "users:manage_roles",
                "skills:read", "skills:write", "skills:manage_categories",
                "matching:access", "matching:view_all",
                "appointments:read", "appointments:write",
                "videocalls:access",
                "system:admin_panel", "system:logs"
            },
            "Moderator" => new List<string>
            {
                "users:read", "skills:read", "skills:write",
                "matching:access", "appointments:read", "videocalls:access"
            },
            "User" => new List<string>
            {
                "skills:read", "skills:write", "matching:access",
                "appointments:read", "appointments:write", "videocalls:access"
            },
            _ => new List<string>()
        };
    }
}
