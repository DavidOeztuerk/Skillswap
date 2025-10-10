using System.Security.Claims;
using Contracts.User.Requests;
using Contracts.User.Responses;
using CQRS.Extensions;
using Infrastructure.Extensions;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UserService.Api.Application.Queries;
using UserService.Application.Commands;
using UserService.Application.Queries;

namespace UserService.Api.Extensions;

public static class UserProfileControllerExtensions
{
    public static RouteGroupBuilder MapUserProfileController(this IEndpointRouteBuilder builder)
    {
        // Public endpoints for service-to-service communication (no auth required)
        var publicProfile = builder.MapGroup("/users/public")
            .AllowAnonymous()
            .WithTags("User Profile - Public");

        publicProfile.MapGet("/{userId}", HandleGetPublicUserProfileAnonymous)
            .WithName("GetPublicUserProfileAnonymous")
            .WithSummary("Get public user profile (Service-to-Service)")
            .WithDescription("Gets a user's public profile information without authentication - for service-to-service calls")
            .Produces<PublicUserProfileResponse>(200)
            .Produces(404);

        // Internal service-to-service endpoint with full user data (Email, Phone)
        var internalProfile = builder.MapGroup("/users/internal")
            .RequireAuthorization(policy => policy.RequireRole("Service"))
            .WithTags("User Profile - Internal");

        internalProfile.MapGet("/{userId}", HandleGetInternalUserProfile)
            .WithName("GetInternalUserProfile")
            .WithSummary("Get full user profile for services (M2M)")
            .WithDescription("Gets full user profile including email and phone - requires Service role (M2M token)")
            .Produces<UserProfileResponse>(200)
            .Produces(401)
            .Produces(404);

        // Authenticated endpoints for user requests
        RouteGroupBuilder profile = builder.MapGroup("/api/users/profile")
            .RequireAuthorization()
            .WithTags("User Profile");

        profile.MapGet("/", HandleGetUserProfile)
            .WithName("GetUserProfile")
            .WithSummary("Get user profile")
            .WithDescription("Gets the current user's profile information")
            .Produces<UserProfileResponse>(200)
            .Produces(401);

        profile.MapGet("/user/{userId}", HandleGetPublicUserProfile)
            .WithName("GetPublicUserProfile")
            .WithSummary("Get public user profile (Authenticated)")
            .WithDescription("Gets a user's public profile information (requires authentication)")
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

        static async Task<IResult> HandleGetPublicUserProfileAnonymous(IMediator mediator, string userId)
        {
            // For service-to-service calls - no authentication required
            // Using "system" as the requesting user ID since this is a service call
            var query = new GetPublicUserProfileQuery(userId, "system");
            return await mediator.SendQuery(query);
        }

        static async Task<IResult> HandleGetInternalUserProfile(IMediator mediator, string userId)
        {
            // For authenticated service-to-service calls with M2M token
            // Returns full user profile including email and phone number
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