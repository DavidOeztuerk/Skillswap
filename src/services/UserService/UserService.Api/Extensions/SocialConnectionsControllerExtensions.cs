using System.Security.Claims;
using Contracts.User.Requests;
using Contracts.User.Responses;
using Contracts.User.Responses.LinkedIn;
using Contracts.User.Responses.Xing;
using CQRS.Extensions;
using Infrastructure.Extensions;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using UserService.Application.Commands.LinkedIn;
using UserService.Application.Commands.Xing;
using UserService.Application.Commands.ImportedSkill;
using UserService.Application.Queries.SocialConnections;

namespace UserService.Api.Extensions;

/// <summary>
/// API endpoints for social connections (LinkedIn/Xing) and imported skills
/// </summary>
public static class SocialConnectionsControllerExtensions
{
    public static RouteGroupBuilder MapSocialConnectionsController(this IEndpointRouteBuilder builder)
    {
        var connections = builder.MapGroup("/api/users/profile/connections")
            .RequireAuthorization()
            .WithTags("Social Connections");

        // =============================================
        // Overview endpoints
        // =============================================

        connections.MapGet("/", HandleGetSocialConnections)
            .WithName("GetSocialConnections")
            .WithSummary("Get all social connections")
            .WithDescription("Gets LinkedIn/Xing connections and imported skills for the current user")
            .Produces<SocialConnectionsResponse>(200)
            .Produces(401);

        // =============================================
        // LinkedIn endpoints
        // =============================================

        var linkedin = builder.MapGroup("/api/users/profile/linkedin")
            .RequireAuthorization()
            .WithTags("LinkedIn Integration");

        linkedin.MapGet("/", HandleGetLinkedInConnection)
            .WithName("GetLinkedInConnection")
            .WithSummary("Get LinkedIn connection")
            .WithDescription("Gets the current user's LinkedIn connection details")
            .Produces<LinkedInConnectionResponse>(200)
            .Produces(401)
            .Produces(404);

        linkedin.MapPost("/connect", HandleInitiateLinkedInConnect)
            .WithName("InitiateLinkedInConnect")
            .WithSummary("Initiate LinkedIn OAuth")
            .WithDescription("Initiates the OAuth flow to connect LinkedIn account")
            .Produces<InitiateLinkedInConnectResponse>(200)
            .Produces(400)
            .Produces(401);

        linkedin.MapPost("/callback", HandleCompleteLinkedInConnect)
            .WithName("CompleteLinkedInConnect")
            .WithSummary("Complete LinkedIn OAuth")
            .WithDescription("Completes the OAuth flow with the callback code")
            .Produces<LinkedInConnectionResponse>(200)
            .Produces(400)
            .Produces(401);

        linkedin.MapPost("/sync", HandleSyncLinkedInProfile)
            .WithName("SyncLinkedInProfile")
            .WithSummary("Sync LinkedIn profile")
            .WithDescription("Syncs experience, education, and skills from LinkedIn")
            .Produces<ProfileSyncResultResponse>(200)
            .Produces(400)
            .Produces(401);

        linkedin.MapDelete("/", HandleDisconnectLinkedIn)
            .WithName("DisconnectLinkedIn")
            .WithSummary("Disconnect LinkedIn")
            .WithDescription("Disconnects the LinkedIn account")
            .Produces<bool>(200)
            .Produces(401);

        // =============================================
        // Xing endpoints
        // =============================================

        var xing = builder.MapGroup("/api/users/profile/xing")
            .RequireAuthorization()
            .WithTags("Xing Integration");

        xing.MapGet("/", HandleGetXingConnection)
            .WithName("GetXingConnection")
            .WithSummary("Get Xing connection")
            .WithDescription("Gets the current user's Xing connection details")
            .Produces<XingConnectionResponse>(200)
            .Produces(401)
            .Produces(404);

        xing.MapPost("/connect", HandleInitiateXingConnect)
            .WithName("InitiateXingConnect")
            .WithSummary("Initiate Xing OAuth")
            .WithDescription("Initiates the OAuth flow to connect Xing account")
            .Produces<InitiateXingConnectResponse>(200)
            .Produces(400)
            .Produces(401);

        xing.MapPost("/callback", HandleCompleteXingConnect)
            .WithName("CompleteXingConnect")
            .WithSummary("Complete Xing OAuth")
            .WithDescription("Completes the OAuth flow with the callback tokens")
            .Produces<XingConnectionResponse>(200)
            .Produces(400)
            .Produces(401);

        xing.MapPost("/sync", HandleSyncXingProfile)
            .WithName("SyncXingProfile")
            .WithSummary("Sync Xing profile")
            .WithDescription("Syncs experience, education, and skills from Xing")
            .Produces<ProfileSyncResultResponse>(200)
            .Produces(400)
            .Produces(401);

        xing.MapDelete("/", HandleDisconnectXing)
            .WithName("DisconnectXing")
            .WithSummary("Disconnect Xing")
            .WithDescription("Disconnects the Xing account")
            .Produces<bool>(200)
            .Produces(401);

        // =============================================
        // Imported Skills endpoints
        // =============================================

        var skills = builder.MapGroup("/api/users/profile/skills")
            .RequireAuthorization()
            .WithTags("Imported Skills");

        skills.MapGet("/", HandleGetImportedSkills)
            .WithName("GetImportedSkills")
            .WithSummary("Get imported skills")
            .WithDescription("Gets all imported skills for the current user")
            .Produces<List<UserImportedSkillResponse>>(200)
            .Produces(401);

        skills.MapPost("/", HandleAddImportedSkill)
            .WithName("AddImportedSkill")
            .WithSummary("Add imported skill")
            .WithDescription("Adds a new manual skill entry")
            .Produces<UserImportedSkillResponse>(200)
            .Produces(400)
            .Produces(401);

        skills.MapPut("/{skillId}", HandleUpdateImportedSkill)
            .WithName("UpdateImportedSkill")
            .WithSummary("Update imported skill")
            .WithDescription("Updates an existing skill entry")
            .Produces<UserImportedSkillResponse>(200)
            .Produces(400)
            .Produces(401)
            .Produces(404);

        skills.MapDelete("/{skillId}", HandleDeleteImportedSkill)
            .WithName("DeleteImportedSkill")
            .WithSummary("Delete imported skill")
            .WithDescription("Deletes a skill entry")
            .Produces<bool>(200)
            .Produces(401)
            .Produces(404);

        skills.MapPatch("/{skillId}/visibility", HandleUpdateSkillVisibility)
            .WithName("UpdateImportedSkillVisibility")
            .WithSummary("Update skill visibility")
            .WithDescription("Updates the visibility of a skill")
            .Produces<UserImportedSkillResponse>(200)
            .Produces(400)
            .Produces(401)
            .Produces(404);

        skills.MapPost("/reorder", HandleReorderSkills)
            .WithName("ReorderImportedSkills")
            .WithSummary("Reorder skills")
            .WithDescription("Updates the sort order of skills")
            .Produces<bool>(200)
            .Produces(400)
            .Produces(401);

        // =============================================
        // Handler implementations
        // =============================================

        // Overview
        static async Task<IResult> HandleGetSocialConnections(IMediator mediator, ClaimsPrincipal user)
        {
            var userId = user.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var query = new GetSocialConnectionsQuery { UserId = userId };
            return await mediator.SendQuery(query);
        }

        // LinkedIn handlers
        static async Task<IResult> HandleGetLinkedInConnection(IMediator mediator, ClaimsPrincipal user)
        {
            var userId = user.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var query = new GetLinkedInConnectionQuery { UserId = userId };
            return await mediator.SendQuery(query);
        }

        static async Task<IResult> HandleInitiateLinkedInConnect(
            IMediator mediator,
            ClaimsPrincipal user,
            [FromBody] InitiateLinkedInConnectRequest request)
        {
            var userId = user.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var command = new InitiateLinkedInConnectCommand(request.RedirectUri)
            {
                UserId = userId
            };
            return await mediator.SendCommand(command);
        }

        static async Task<IResult> HandleCompleteLinkedInConnect(
            IMediator mediator,
            ClaimsPrincipal user,
            [FromBody] CompleteLinkedInConnectRequest request)
        {
            var userId = user.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var command = new CompleteLinkedInConnectCommand(request.Code, request.State, request.RedirectUri)
            {
                UserId = userId
            };
            return await mediator.SendCommand(command);
        }

        static async Task<IResult> HandleSyncLinkedInProfile(IMediator mediator, ClaimsPrincipal user)
        {
            var userId = user.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var command = new SyncLinkedInProfileCommand { UserId = userId };
            return await mediator.SendCommand(command);
        }

        static async Task<IResult> HandleDisconnectLinkedIn(IMediator mediator, ClaimsPrincipal user)
        {
            var userId = user.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var command = new DisconnectLinkedInCommand { UserId = userId };
            return await mediator.SendCommand(command);
        }

        // Xing handlers
        static async Task<IResult> HandleGetXingConnection(IMediator mediator, ClaimsPrincipal user)
        {
            var userId = user.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var query = new GetXingConnectionQuery { UserId = userId };
            return await mediator.SendQuery(query);
        }

        static async Task<IResult> HandleInitiateXingConnect(
            IMediator mediator,
            ClaimsPrincipal user,
            [FromBody] InitiateXingConnectRequest request)
        {
            var userId = user.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var command = new InitiateXingConnectCommand(request.RedirectUri)
            {
                UserId = userId
            };
            return await mediator.SendCommand(command);
        }

        static async Task<IResult> HandleCompleteXingConnect(
            IMediator mediator,
            ClaimsPrincipal user,
            [FromBody] CompleteXingConnectRequest request)
        {
            var userId = user.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var command = new CompleteXingConnectCommand(
                request.OAuthToken,
                request.OAuthVerifier,
                request.RedirectUri)
            {
                UserId = userId
            };
            return await mediator.SendCommand(command);
        }

        static async Task<IResult> HandleSyncXingProfile(IMediator mediator, ClaimsPrincipal user)
        {
            var userId = user.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var command = new SyncXingProfileCommand { UserId = userId };
            return await mediator.SendCommand(command);
        }

        static async Task<IResult> HandleDisconnectXing(IMediator mediator, ClaimsPrincipal user)
        {
            var userId = user.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var command = new DisconnectXingCommand { UserId = userId };
            return await mediator.SendCommand(command);
        }

        // Imported Skills handlers
        static async Task<IResult> HandleGetImportedSkills(IMediator mediator, ClaimsPrincipal user)
        {
            var userId = user.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var query = new GetUserImportedSkillsQuery { UserId = userId };
            return await mediator.SendQuery(query);
        }

        static async Task<IResult> HandleAddImportedSkill(
            IMediator mediator,
            ClaimsPrincipal user,
            [FromBody] AddImportedSkillRequest request)
        {
            var userId = user.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var command = new AddImportedSkillCommand(request.Name, request.Category, request.SortOrder)
            {
                UserId = userId
            };
            return await mediator.SendCommand(command);
        }

        static async Task<IResult> HandleUpdateImportedSkill(
            IMediator mediator,
            ClaimsPrincipal user,
            string skillId,
            [FromBody] UpdateImportedSkillRequest request)
        {
            var userId = user.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var command = new UpdateImportedSkillCommand(
                skillId,
                request.Name,
                request.Category,
                request.SortOrder,
                request.IsVisible)
            {
                UserId = userId
            };
            return await mediator.SendCommand(command);
        }

        static async Task<IResult> HandleDeleteImportedSkill(
            IMediator mediator,
            ClaimsPrincipal user,
            string skillId)
        {
            var userId = user.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var command = new DeleteImportedSkillCommand(skillId) { UserId = userId };
            return await mediator.SendCommand(command);
        }

        static async Task<IResult> HandleUpdateSkillVisibility(
            IMediator mediator,
            ClaimsPrincipal user,
            string skillId,
            [FromBody] UpdateImportedSkillVisibilityRequest request)
        {
            var userId = user.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var command = new UpdateImportedSkillVisibilityCommand(skillId, request.IsVisible)
            {
                UserId = userId
            };
            return await mediator.SendCommand(command);
        }

        static async Task<IResult> HandleReorderSkills(
            IMediator mediator,
            ClaimsPrincipal user,
            [FromBody] ReorderImportedSkillsRequest request)
        {
            var userId = user.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var command = new ReorderImportedSkillsCommand(request.Skills) { UserId = userId };
            return await mediator.SendCommand(command);
        }

        return connections;
    }
}

// Request DTOs for API endpoints
public record InitiateLinkedInConnectRequest(string RedirectUri);
public record CompleteLinkedInConnectRequest(string Code, string State, string RedirectUri);
public record InitiateXingConnectRequest(string RedirectUri);
public record CompleteXingConnectRequest(string OAuthToken, string OAuthVerifier, string RedirectUri);
