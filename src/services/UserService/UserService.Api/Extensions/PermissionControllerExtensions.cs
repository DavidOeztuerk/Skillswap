using System.Security.Claims;
using Contracts.UserService.Permissions;
using CQRS.Extensions;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using UserService.Application.Commands.Permissions;
using UserService.Application.Queries.Permissions;

namespace UserService.Api.Extensions;

public static class PermissionControllerExtensions
{
    public static RouteGroupBuilder MapPermissionController(this IEndpointRouteBuilder builder)
    {
        RouteGroupBuilder permissions = builder.MapGroup("/users/permissions")
            .RequireAuthorization()
            .WithTags("Permissions");

        // User's own permissions
        permissions.MapGet("/my", HandleGetMyPermissions)
            .WithName("GetMyPermissions")
            .WithSummary("Get current user's permissions")
            .WithDescription("Gets permissions for the authenticated user")
            .Produces<UserPermissionsResponse>(200)
            .Produces(401);

        // Check permissions
        permissions.MapPost("/check", HandleCheckPermission)
            .WithName("CheckPermission")
            .WithSummary("Check if user has permission")
            .WithDescription("Checks if a user has a specific permission")
            .Produces<bool>(200)
            .Produces(400)
            .Produces(401);

        permissions.MapPost("/check-multiple", HandleCheckMultiplePermissions)
            .WithName("CheckMultiplePermissions")
            .WithSummary("Check multiple permissions")
            .WithDescription("Checks if a user has multiple permissions")
            .Produces<bool>(200)
            .Produces(400)
            .Produces(401);

        // Admin endpoints
        var admin = permissions.MapGroup("/admin")
            .RequireAuthorization("AdminPolicy");

        admin.MapGet("/user/{userId}", HandleGetUserPermissions)
            .WithName("GetUserPermissions")
            .WithSummary("Get user permissions (Admin)")
            .WithDescription("Gets permissions for a specific user")
            .Produces<UserPermissionsResponse>(200)
            .Produces(401)
            .Produces(403);

        admin.MapPost("/grant", HandleGrantPermission)
            .WithName("GrantPermission")
            .WithSummary("Grant permission (Admin)")
            .WithDescription("Grants a permission to a user")
            .Produces<bool>(200)
            .Produces(400)
            .Produces(401)
            .Produces(403);

        admin.MapPost("/revoke", HandleRevokePermission)
            .WithName("RevokePermission")
            .WithSummary("Revoke permission (Admin)")
            .WithDescription("Revokes a permission from a user")
            .Produces<bool>(200)
            .Produces(400)
            .Produces(401)
            .Produces(403);

        admin.MapPost("/assign-role", HandleAssignRole)
            .WithName("AssignRole")
            .WithSummary("Assign role (Admin)")
            .WithDescription("Assigns a role to a user")
            .Produces<bool>(200)
            .Produces(400)
            .Produces(401)
            .Produces(403);

        admin.MapPost("/remove-role", HandleRemoveRole)
            .WithName("RemoveRole")
            .WithSummary("Remove role (Admin)")
            .WithDescription("Removes a role from a user")
            .Produces<bool>(200)
            .Produces(400)
            .Produces(401)
            .Produces(403);

        admin.MapPost("/sync", HandleSyncPermissions)
            .WithName("SyncPermissions")
            .WithSummary("Sync permissions (Admin)")
            .WithDescription("Syncs user permissions")
            .Produces<bool>(200)
            .Produces(400)
            .Produces(401)
            .Produces(403);

        admin.MapGet("/all", HandleGetAllPermissions)
            .WithName("GetAllPermissions")
            .WithSummary("Get all permissions (Admin)")
            .WithDescription("Gets all available permissions")
            .Produces<List<PermissionDto>>(200)
            .Produces(401)
            .Produces(403);

        admin.MapGet("/roles", HandleGetAllRoles)
            .WithName("GetAllRoles")
            .WithSummary("Get all roles (Admin)")
            .WithDescription("Gets all available roles")
            .Produces<List<RoleDto>>(200)
            .Produces(401)
            .Produces(403);

        admin.MapGet("/history/{userId}", HandleGetPermissionHistory)
            .WithName("GetPermissionHistory")
            .WithSummary("Get permission history (Admin)")
            .WithDescription("Gets permission history for a user")
            .Produces<PermissionHistoryResponse>(200)
            .Produces(401)
            .Produces(403);

        // Super admin endpoints
        var superAdmin = permissions.MapGroup("/super-admin")
            .RequireAuthorization("SuperAdminPolicy");

        superAdmin.MapPost("/create-role", HandleCreateRole)
            .WithName("CreateRole")
            .WithSummary("Create role (SuperAdmin)")
            .WithDescription("Creates a new role")
            .Produces<RoleDto>(200)
            .Produces(400)
            .Produces(401)
            .Produces(403);

        superAdmin.MapPost("/grant-to-role", HandleGrantPermissionToRole)
            .WithName("GrantPermissionToRole")
            .WithSummary("Grant permission to role (SuperAdmin)")
            .WithDescription("Grants a permission to a role")
            .Produces<bool>(200)
            .Produces(400)
            .Produces(401)
            .Produces(403);

        superAdmin.MapPost("/revoke-from-role", HandleRevokePermissionFromRole)
            .WithName("RevokePermissionFromRole")
            .WithSummary("Revoke permission from role (SuperAdmin)")
            .WithDescription("Revokes a permission from a role")
            .Produces<bool>(200)
            .Produces(400)
            .Produces(401)
            .Produces(403);

        return permissions;

        // Handler implementations
        static async Task<IResult> HandleGetMyPermissions(
            IMediator mediator,
            ClaimsPrincipal user)
        {
            var userId = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Results.Unauthorized();

            var query = new GetUserPermissionsQuery(userId);
            return await mediator.SendQuery(query);
        }

        static async Task<IResult> HandleGetUserPermissions(
            IMediator mediator,
            string userId)
        {
            var query = new GetUserPermissionsQuery(userId);
            return await mediator.SendQuery(query);
        }

        static async Task<IResult> HandleCheckPermission(
            IMediator mediator,
            [FromBody] CheckPermissionRequest request)
        {
            var query = new CheckPermissionQuery(
                request.UserId.ToString(),
                request.PermissionName,
                request.ResourceId);
            return await mediator.SendQuery(query);
        }

        static async Task<IResult> HandleCheckMultiplePermissions(
            IMediator mediator,
            [FromBody] CheckMultiplePermissionsRequest request)
        {
            var query = new CheckMultiplePermissionsQuery(
                request.UserId.ToString(),
                request.PermissionNames,
                request.RequireAll);
            return await mediator.SendQuery(query);
        }

        static async Task<IResult> HandleGrantPermission(
            IMediator mediator,
            ClaimsPrincipal user,
            [FromBody] GrantPermissionRequest request)
        {
            var grantedBy = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var command = new GrantPermissionCommand(
                request.PermissionName,
                request.GrantedBy?.ToString() ?? grantedBy,
                request.ExpiresAt,
                request.ResourceId,
                request.Reason)
            {
                UserId = request.UserId.ToString()
            };
            return await mediator.SendCommand(command);
        }

        static async Task<IResult> HandleRevokePermission(
            IMediator mediator,
            ClaimsPrincipal user,
            [FromBody] RevokePermissionRequest request)
        {
            var revokedBy = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var command = new RevokePermissionCommand(
                request.PermissionName,
                request.RevokedBy?.ToString() ?? revokedBy,
                request.Reason)
            {
                UserId = request.UserId.ToString()
            };
            return await mediator.SendCommand(command);
        }

        static async Task<IResult> HandleAssignRole(
            IMediator mediator,
            ClaimsPrincipal user,
            [FromBody] AssignRoleRequest request)
        {
            var assignedBy = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var command = new AssignRoleCommand(
                request.RoleName,
                request.AssignedBy?.ToString() ?? assignedBy,
                request.Reason)
            {
                UserId = request.UserId.ToString()
            };
            return await mediator.SendCommand(command);
        }

        static async Task<IResult> HandleRemoveRole(
            IMediator mediator,
            ClaimsPrincipal user,
            [FromBody] RemoveRoleRequest request)
        {
            var removedBy = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var command = new RemoveRoleCommand(
                request.RoleName,
                request.RemovedBy?.ToString() ?? removedBy,
                request.Reason)
            {
                UserId = request.UserId.ToString()
            };
            return await mediator.SendCommand(command);
        }

        static async Task<IResult> HandleSyncPermissions(
            IMediator mediator,
            [FromBody] SyncPermissionsRequest request)
        {
            var command = new SyncUserPermissionsCommand(
                request.PermissionNames)
            {
                UserId = request.UserId.ToString()
            };
            return await mediator.SendCommand(command);
        }

        static async Task<IResult> HandleGetAllPermissions(IMediator mediator)
        {
            var query = new GetAllPermissionsQuery();
            return await mediator.SendQuery(query);
        }

        static async Task<IResult> HandleGetAllRoles(IMediator mediator)
        {
            var query = new GetAllRolesQuery();
            return await mediator.SendQuery(query);
        }

        static async Task<IResult> HandleGetPermissionHistory(
            IMediator mediator,
            string userId)
        {
            var query = new GetPermissionHistoryQuery(userId);
            return await mediator.SendQuery(query);
        }

        static async Task<IResult> HandleCreateRole(
            IMediator mediator,
            [FromBody] CreateRoleRequest request)
        {
            var command = new CreateRoleCommand(
                request.Name,
                request.Description,
                request.Priority,
                request.ParentRoleId?.ToString(),
                request.InitialPermissions);
            return await mediator.SendCommand(command);
        }

        static async Task<IResult> HandleGrantPermissionToRole(
            IMediator mediator,
            ClaimsPrincipal user,
            [FromBody] GrantPermissionToRoleRequest request)
        {
            var grantedBy = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var command = new GrantPermissionToRoleCommand(
                request.RoleId.ToString(),
                request.PermissionName,
                grantedBy,
                request.Reason);
            return await mediator.SendCommand(command);
        }

        static async Task<IResult> HandleRevokePermissionFromRole(
            IMediator mediator,
            ClaimsPrincipal user,
            [FromBody] RevokePermissionFromRoleRequest request)
        {
            var revokedBy = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var command = new RevokePermissionFromRoleCommand(
                request.RoleId.ToString(),
                request.PermissionName,
                revokedBy,
                request.Reason);
            return await mediator.SendCommand(command);
        }
    }
}