using System.Security.Claims;
using Contracts.User.Requests;
using CQRS.Extensions;
using CQRS.Models;
using Infrastructure.Extensions;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using UserService.Application.Commands;
using UserService.Application.Queries;

namespace UserService.Api.Extensions;

public static class UserSkillsControllerExtensions
{
    public static RouteGroupBuilder MapUserSkillsController(this IEndpointRouteBuilder builder)
    {
        RouteGroupBuilder skills = builder.MapGroup("/users/skills")
            .RequireAuthorization()
            .WithTags("User favorite skills");

        skills.MapGet("/favorites", HandleGetFavoriteSkills)
            .WithName("GetFavoriteSkills")
            .WithSummary("Get favorite skills")
            .WithDescription("Gets the current user's favorite skill IDs")
            .Produces<PagedResponse<string>>(200)
            .Produces(401);
            
        skills.MapGet("/favorites/details", HandleGetFavoriteSkillsWithDetails)
            .WithName("GetFavoriteSkillsWithDetails")
            .WithSummary("Get favorite skills with details")
            .WithDescription("Gets the current user's favorite skills with full details from SkillService")
            .Produces<PagedResponse<FavoriteSkillDetailResponse>>(200)
            .Produces(401);

        skills.MapPost("/favorites", HandleAddFavoriteSkill)
            .WithName("AddFavoriteSkill")
            .WithSummary("Add favorite skill")
            .WithDescription("Adds a skill to the user's favorites")
            .Produces<ApiResponse<bool>>(200)
            .Produces(400)
            .Produces(401);

        skills.MapDelete("/favorites/{skillId}", HandleRemoveFavoriteSkill)
            .WithName("RemoveFavoriteSkill")
            .WithSummary("Remove favorite skill")
            .WithDescription("Removes a skill from the user's favorites")
            .Produces<ApiResponse<bool>>(200)
            .Produces(400)
            .Produces(401);

        static async Task<IResult> HandleGetFavoriteSkills(IMediator mediator, ClaimsPrincipal user, [FromQuery] int PageNumber, [FromQuery] int PageSize)
        {
            var userId = user.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var query = new GetFavoriteSkillsQuery(userId, PageNumber, PageSize);
            return await mediator.SendQuery(query);
        }
        
        static async Task<IResult> HandleGetFavoriteSkillsWithDetails(IMediator mediator, ClaimsPrincipal user, [FromQuery] int PageNumber = 1, [FromQuery] int PageSize = 20)
        {
            var userId = user.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var query = new GetFavoriteSkillsWithDetailsQuery(userId, PageNumber, PageSize);
            return await mediator.SendQuery(query);
        }

        static async Task<IResult> HandleAddFavoriteSkill(IMediator mediator, ClaimsPrincipal user, [FromBody] AddFavoriteSkillRequest request)
        {
            var userId = user.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var command = new AddFavoriteSkillCommand(request.SkillId) { UserId = userId };
            return await mediator.SendCommand(command);
        }

        static async Task<IResult> HandleRemoveFavoriteSkill(IMediator mediator, ClaimsPrincipal user, string skillId)
        {
            var userId = user.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var command = new RemoveFavoriteSkillCommand(skillId) { UserId = userId };
            return await mediator.SendCommand(command);
        }

        return skills;
    }
}