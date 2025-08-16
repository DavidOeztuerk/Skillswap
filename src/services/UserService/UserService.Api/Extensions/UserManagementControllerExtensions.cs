using Contracts.User.Requests;
using Contracts.User.Responses;
using CQRS.Extensions;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using UserService.Application.Commands;
using UserService.Application.Queries;

namespace UserService.Api.Extensions;

public static class UserManagementControllerExtensions
{
    public static RouteGroupBuilder MapUserManagementController(this IEndpointRouteBuilder builder)
    {
        RouteGroupBuilder management = builder.MapGroup("/users/management")
            .RequireAuthorization("AdminPolicy")
            .WithTags("User Management");

        management.MapGet("/", HandleGetAllUsers)
            .WithName("GetAllUsers")
            .WithSummary("Get all users")
            .WithDescription("Gets a paginated list of all users (Admin only)")
            .Produces<GetAllUsersResponse>(200)
            .Produces(401)
            .Produces(403);

        management.MapGet("/search", HandleSearchUsers)
            .WithName("SearchUsers")
            .WithSummary("Search users")
            .WithDescription("Searches users with filters (Admin only)")
            .Produces<SearchUsersResponse>(200)
            .Produces(401)
            .Produces(403);

        management.MapGet("/{userId}/statistics", HandleGetUserStatistics)
            .WithName("GetUserStatistics")
            .WithSummary("Get user statistics")
            .WithDescription("Gets detailed statistics for a specific user (Admin only)")
            .Produces<GetUserStatisticsResponse>(200)
            .Produces(401)
            .Produces(403)
            .Produces(404);

        management.MapGet("/{userId}/activities", HandleGetUserActivityLog)
            .WithName("GetUserActivityLog")
            .WithSummary("Get user activity log")
            .WithDescription("Gets activity log for a specific user (Admin only)")
            .Produces<UserActivityResponse>(200)
            .Produces(401)
            .Produces(403)
            .Produces(404);

        management.MapPost("/{userId}/roles", HandleAssignUserRole)
            .WithName("AssignUserRole")
            .WithSummary("Assign user role")
            .WithDescription("Assigns a role to a user (Admin only)")
            .Produces<AssignUserRoleResponse>(200)
            .Produces(400)
            .Produces(401)
            .Produces(403)
            .Produces(404);

        static async Task<IResult> HandleGetAllUsers(
            IMediator mediator,
            [FromQuery] int pageNumber,
            [FromQuery] int pageSize)
        {
            var query = new GetAllUsersQuery { PageNumber = pageNumber, PageSize = pageSize };
            return await mediator.SendQuery(query);
        }

        static async Task<IResult> HandleSearchUsers(
            IMediator mediator,
            [FromQuery] string? searchTerm = null,
            [FromQuery] string? role = null,
            [FromQuery] string? accountStatus = null,
            [FromQuery] bool? emailVerified = null,
            [FromQuery] DateTime? createdAfter = null,
            [FromQuery] DateTime? createdBefore = null,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10)
        {
            var query = new SearchUsersQuery
            {
                SearchTerm = searchTerm,
                Role = role,
                AccountStatus = accountStatus,
                EmailVerified = emailVerified,
                CreatedAfter = createdAfter,
                CreatedBefore = createdBefore,
                PageNumber = pageNumber,
                PageSize = pageSize
            };
            return await mediator.SendQuery(query);
        }

        static async Task<IResult> HandleGetUserStatistics(
            IMediator mediator,
            [FromQuery] DateTime from,
            [FromQuery] DateTime to)
        {
            var query = new GetUserStatisticsQuery(from, to);
            return await mediator.SendQuery(query);
        }

        static async Task<IResult> HandleGetUserActivityLog(
            IMediator mediator,
            string userId,
            [FromQuery] DateTime? fromDate = null,
            [FromQuery] DateTime? toDate = null,
            [FromQuery] string? activityType = null,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10)
        {
            var query = new GetUserActivityLogQuery(userId)
            {
                FromDate = fromDate,
                ToDate = toDate,
                ActivityType = activityType,
                PageNumber = pageNumber,
                PageSize = pageSize
            };
            return await mediator.SendQuery(query);
        }

        static async Task<IResult> HandleAssignUserRole(IMediator mediator, string userId, [FromBody] AssignUserRoleRequest request)
        {
            var command = new AssignUserRoleCommand(request.Role, request.AssignedBy) { UserId = userId };
            return await mediator.SendCommand(command);
        }

        return management;
    }
}