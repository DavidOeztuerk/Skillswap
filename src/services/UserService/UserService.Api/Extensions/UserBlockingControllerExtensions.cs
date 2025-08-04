using System.Security.Claims;
using Contracts.User.Requests;
using Contracts.User.Responses;
using CQRS.Extensions;
using Infrastructure.Extensions;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using UserService.Api.Application.Queries;
using UserService.Application.Commands;
using UserService.Application.Queries;

namespace UserService.Api.Extensions;

public static class UserBlockingControllerExtensions
{
    public static RouteGroupBuilder MapUserBlockingController(this IEndpointRouteBuilder builder)
    {
        RouteGroupBuilder blocking = builder.MapGroup("/users/blocking")
            .RequireAuthorization()
            .WithTags("User Blocking");

        blocking.MapPost("/block", HandleBlockUser)
            .WithName("BlockUser")
            .WithSummary("Block user")
            .WithDescription("Blocks a user from interacting with the current user")
            .Produces<BlockUserResponse>(200)
            .Produces(400)
            .Produces(401);

        blocking.MapPost("/unblock", HandleUnblockUser)
            .WithName("UnblockUser")
            .WithSummary("Unblock user")
            .WithDescription("Unblocks a previously blocked user")
            .Produces<UnblockUserResponse>(200)
            .Produces(400)
            .Produces(401);

        blocking.MapGet("/blocked", HandleGetBlockedUsers)
            .WithName("GetBlockedUsers")
            .WithSummary("Get blocked users")
            .WithDescription("Gets a paginated list of blocked users")
            .Produces<GetBlockedUsersResponse>(200)
            .Produces(401);

        static async Task<IResult> HandleBlockUser(IMediator mediator, ClaimsPrincipal user, [FromBody] BlockUserRequest request)
        {
            var userId = user.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var command = new BlockUserCommand(request.BlockedUserId, request.Reason) { UserId = userId };
            return await mediator.SendCommand(command);
        }

        static async Task<IResult> HandleUnblockUser(IMediator mediator, ClaimsPrincipal user, [FromBody] UnblockUserRequest request)
        {
            var userId = user.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var command = new UnblockUserCommand(request.BlockedUserId) { UserId = userId };
            return await mediator.SendCommand(command);
        }

        static async Task<IResult> HandleGetBlockedUsers(IMediator mediator, ClaimsPrincipal user, [FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10)
        {
            var userId = user.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var query = new GetBlockedUsersQuery(userId, pageNumber, pageSize);
            return await mediator.SendQuery(query);
        }

        return blocking;
    }
}