using System.Security.Claims;
using Contracts.User.Requests;
using Contracts.User.Responses;
using CQRS.Extensions;
using Infrastructure.Extensions;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using UserService.Api.Application.Queries;
using UserService.Application.Commands;
using UserService.Application.Commands.Favorites;
using UserService.Application.Queries;

namespace UserService.Api.Extensions;

public static class UserSkillsControllerExtensions
{
    public static RouteGroupBuilder MapUserSkillsController(this IEndpointRouteBuilder builder)
    {
        RouteGroupBuilder skills = builder.MapGroup("/users/skills")
            .RequireAuthorization()
            .WithTags("User Skills");

        skills.MapGet("/favorites", HandleGetFavoriteSkills)
            .WithName("GetFavoriteSkills")
            .WithSummary("Get favorite skills")
            .WithDescription("Gets the current user's favorite skills")
            .Produces<GetFavoriteSkillsResponse>(200)
            .Produces(401);

        skills.MapPost("/favorites", HandleAddFavoriteSkill)
            .WithName("AddFavoriteSkill")
            .WithSummary("Add favorite skill")
            .WithDescription("Adds a skill to the user's favorites")
            .Produces<AddFavoriteSkillResponse>(200)
            .Produces(400)
            .Produces(401);

        skills.MapDelete("/favorites/{skillId}", HandleRemoveFavoriteSkill)
            .WithName("RemoveFavoriteSkill")
            .WithSummary("Remove favorite skill")
            .WithDescription("Removes a skill from the user's favorites")
            .Produces<RemoveFavoriteSkillResponse>(200)
            .Produces(400)
            .Produces(401);

        static async Task<IResult> HandleGetFavoriteSkills(IMediator mediator, ClaimsPrincipal user)
        {
            var userId = user.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var query = new GetFavoriteSkillsQuery(userId);
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