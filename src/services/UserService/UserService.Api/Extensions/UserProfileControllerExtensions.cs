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
using UserService.Application.Commands.Experience;
using UserService.Application.Commands.Education;
using UserService.Application.Commands.Review;
using UserService.Application.Queries;
using CQRS.Models;

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

        // Experience endpoints
        profile.MapGet("/me/experience", HandleGetMyExperiences)
            .WithName("GetMyExperiences")
            .WithSummary("Get my experiences")
            .WithDescription("Gets the current user's work experiences")
            .Produces<List<UserExperienceResponse>>(200)
            .Produces(401);

        profile.MapPost("/me/experience", HandleAddExperience)
            .WithName("AddExperience")
            .WithSummary("Add experience")
            .WithDescription("Adds a new work experience entry")
            .Produces<UserExperienceResponse>(200)
            .Produces(400)
            .Produces(401);

        profile.MapPut("/me/experience/{experienceId}", HandleUpdateExperience)
            .WithName("UpdateExperience")
            .WithSummary("Update experience")
            .WithDescription("Updates an existing work experience entry")
            .Produces<UserExperienceResponse>(200)
            .Produces(400)
            .Produces(401)
            .Produces(404);

        profile.MapDelete("/me/experience/{experienceId}", HandleDeleteExperience)
            .WithName("DeleteExperience")
            .WithSummary("Delete experience")
            .WithDescription("Deletes a work experience entry")
            .Produces<bool>(200)
            .Produces(401)
            .Produces(404);

        // Education endpoints
        profile.MapGet("/me/education", HandleGetMyEducation)
            .WithName("GetMyEducation")
            .WithSummary("Get my education")
            .WithDescription("Gets the current user's education entries")
            .Produces<List<UserEducationResponse>>(200)
            .Produces(401);

        profile.MapPost("/me/education", HandleAddEducation)
            .WithName("AddEducation")
            .WithSummary("Add education")
            .WithDescription("Adds a new education entry")
            .Produces<UserEducationResponse>(200)
            .Produces(400)
            .Produces(401);

        profile.MapPut("/me/education/{educationId}", HandleUpdateEducation)
            .WithName("UpdateEducation")
            .WithSummary("Update education")
            .WithDescription("Updates an existing education entry")
            .Produces<UserEducationResponse>(200)
            .Produces(400)
            .Produces(401)
            .Produces(404);

        profile.MapDelete("/me/education/{educationId}", HandleDeleteEducation)
            .WithName("DeleteEducation")
            .WithSummary("Delete education")
            .WithDescription("Deletes an education entry")
            .Produces<bool>(200)
            .Produces(401)
            .Produces(404);

        // Review endpoints
        profile.MapGet("/user/{userId}/reviews", HandleGetUserReviews)
            .WithName("GetUserReviews")
            .WithSummary("Get user reviews")
            .WithDescription("Gets the reviews for a specific user")
            .Produces<PagedResponse<UserReviewResponse>>(200)
            .Produces(401)
            .Produces(404);

        profile.MapPost("/reviews", HandleCreateReview)
            .WithName("CreateReview")
            .WithSummary("Create review")
            .WithDescription("Creates a new review for another user")
            .Produces<UserReviewResponse>(200)
            .Produces(400)
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
                FirstName: request.FirstName,
                LastName: request.LastName,
                UserName: request.UserName,
                Bio: request.Bio)
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

        // Experience handlers
        static async Task<IResult> HandleGetMyExperiences(IMediator mediator, ClaimsPrincipal user)
        {
            var userId = user.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var query = new GetUserExperiencesQuery(userId);
            return await mediator.SendQuery(query);
        }

        static async Task<IResult> HandleAddExperience(IMediator mediator, ClaimsPrincipal user, [FromBody] AddExperienceRequest request)
        {
            var userId = user.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var command = new AddExperienceCommand(
                request.Title,
                request.Company,
                request.StartDate,
                request.EndDate,
                request.Description,
                request.SortOrder)
            {
                UserId = userId
            };
            return await mediator.SendCommand(command);
        }

        static async Task<IResult> HandleUpdateExperience(IMediator mediator, ClaimsPrincipal user, string experienceId, [FromBody] UpdateExperienceRequest request)
        {
            var userId = user.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var command = new UpdateExperienceCommand(
                experienceId,
                request.Title,
                request.Company,
                request.StartDate,
                request.EndDate,
                request.Description,
                request.SortOrder)
            {
                UserId = userId
            };
            return await mediator.SendCommand(command);
        }

        static async Task<IResult> HandleDeleteExperience(IMediator mediator, ClaimsPrincipal user, string experienceId)
        {
            var userId = user.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var command = new DeleteExperienceCommand(experienceId) { UserId = userId };
            return await mediator.SendCommand(command);
        }

        // Education handlers
        static async Task<IResult> HandleGetMyEducation(IMediator mediator, ClaimsPrincipal user)
        {
            var userId = user.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var query = new GetUserEducationQuery(userId);
            return await mediator.SendQuery(query);
        }

        static async Task<IResult> HandleAddEducation(IMediator mediator, ClaimsPrincipal user, [FromBody] AddEducationRequest request)
        {
            var userId = user.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var command = new AddEducationCommand(
                request.Degree,
                request.Institution,
                request.GraduationYear,
                request.GraduationMonth,
                request.Description,
                request.SortOrder)
            {
                UserId = userId
            };
            return await mediator.SendCommand(command);
        }

        static async Task<IResult> HandleUpdateEducation(IMediator mediator, ClaimsPrincipal user, string educationId, [FromBody] UpdateEducationRequest request)
        {
            var userId = user.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var command = new UpdateEducationCommand(
                educationId,
                request.Degree,
                request.Institution,
                request.GraduationYear,
                request.GraduationMonth,
                request.Description,
                request.SortOrder)
            {
                UserId = userId
            };
            return await mediator.SendCommand(command);
        }

        static async Task<IResult> HandleDeleteEducation(IMediator mediator, ClaimsPrincipal user, string educationId)
        {
            var userId = user.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var command = new DeleteEducationCommand(educationId) { UserId = userId };
            return await mediator.SendCommand(command);
        }

        // Review handlers
        static async Task<IResult> HandleGetUserReviews(IMediator mediator, ClaimsPrincipal user, string userId, int pageNumber = 1, int pageSize = 10)
        {
            var requestingUserId = user.GetUserId();
            if (string.IsNullOrEmpty(requestingUserId)) return Results.Unauthorized();

            var query = new GetUserReviewsQuery
            {
                UserId = userId,
                PageNumber = pageNumber,
                PageSize = pageSize
            };
            return await mediator.SendQuery(query);
        }

        static async Task<IResult> HandleCreateReview(IMediator mediator, ClaimsPrincipal user, [FromBody] CreateReviewRequest request)
        {
            var reviewerId = user.GetUserId();
            if (string.IsNullOrEmpty(reviewerId)) return Results.Unauthorized();

            var command = new CreateReviewCommand(
                request.RevieweeId,
                request.Rating,
                request.ReviewText,
                request.SessionId,
                request.SkillId)
            {
                ReviewerId = reviewerId
            };
            return await mediator.SendCommand(command);
        }

        return profile;
    }
}