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

public static class UserProfileControllerExtensions
{
    public static RouteGroupBuilder MapUserProfileController(this IEndpointRouteBuilder builder)
    {
        RouteGroupBuilder profile = builder.MapGroup("/users/profile")
            .RequireAuthorization()
            .WithTags("User Profile");

        profile.MapGet("/", HandleGetUserProfile)
            .WithName("GetUserProfile")
            .WithSummary("Get user profile")
            .WithDescription("Gets the current user's profile information")
            .Produces<UserProfileResponse>(200)
            .Produces(401);

        profile.MapGet("/{userId}", HandleGetPublicUserProfile)
            .WithName("GetPublicUserProfile")
            .WithSummary("Get public user profile")
            .WithDescription("Gets a user's public profile information")
            .Produces<UserProfileResponse>(200)
            .Produces(401)
            .Produces(404);

        profile.MapPut("/", HandleUpdateUserProfile)
            .WithName("UpdateUserProfile")
            .WithSummary("Update user profile")
            .WithDescription("Updates the current user's profile information")
            .Produces<UpdateUserProfileResponse>(200)
            .Produces(400)
            .Produces(401);

        profile.MapPost("/avatar", HandleUploadAvatar)
            .WithName("UploadAvatar")
            .WithSummary("Upload avatar")
            .WithDescription("Uploads a new avatar image for the user")
            .Produces<UploadAvatarResponse>(200)
            .Produces(400)
            .Produces(401);

        profile.MapDelete("/avatar", HandleDeleteAvatar)
            .WithName("DeleteAvatar")
            .WithSummary("Delete avatar")
            .WithDescription("Deletes the user's avatar image")
            .Produces<DeleteAvatarResponse>(200)
            .Produces(401);

        static async Task<IResult> HandleGetUserProfile(IMediator mediator, ClaimsPrincipal user)
        {
            var userId = user.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var query = new GetUserProfileQuery(userId);
            return await mediator.SendQuery(query);
        }

        static async Task<IResult> HandleGetPublicUserProfile(IMediator mediator, ClaimsPrincipal user, string userId)
        {
            var requestingUserId = user.GetUserId();
            if (string.IsNullOrEmpty(requestingUserId)) return Results.Unauthorized();

            var query = new GetPublicUserProfileQuery(userId, requestingUserId);
            return await mediator.SendQuery(query);
        }

        static async Task<IResult> HandleUpdateUserProfile(IMediator mediator, ClaimsPrincipal user, [FromBody] UpdateUserProfileRequest request)
        {
            var userId = user.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var command = new UpdateUserProfileCommand(
                request.FirstName,
                request.LastName,
                request.UserName,
                request.Bio)
            {
                UserId = userId
            };
            return await mediator.SendCommand(command);
        }

        static async Task<IResult> HandleUploadAvatar(IMediator mediator, ClaimsPrincipal user, [FromBody] UploadAvatarRequest request)
        {
            var userId = user.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var command = new UploadAvatarCommand(request.ImageData, request.FileName, request.ContentType)
            {
                UserId = userId
            };
            return await mediator.SendCommand(command);
        }

        static async Task<IResult> HandleDeleteAvatar(IMediator mediator, ClaimsPrincipal user)
        {
            var userId = user.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var command = new DeleteAvatarCommand { UserId = userId };
            return await mediator.SendCommand(command);
        }

        return profile;
    }
}