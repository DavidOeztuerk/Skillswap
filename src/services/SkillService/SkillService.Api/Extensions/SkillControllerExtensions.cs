using System.Security.Claims;
using Contracts.Skill.Requests;
using Contracts.Skill.Responses;
using CQRS.Extensions;
using CQRS.Models;
using Infrastructure.Extensions;
using Infrastructure.Security;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using SkillService.Application.Commands;
using SkillService.Application.Queries;

namespace SkillService.Extensions;

public static class SkillControllerExtensions
{
    public static RouteGroupBuilder MapSkillController(this IEndpointRouteBuilder builder)
    {
        #region Skills Endpoints
        RouteGroupBuilder skills = builder.MapGroup("/skills");

        skills.MapGet("/", SearchSkills)
            .WithName("SearchSkills")
            .WithSummary("Search skills")
            .WithDescription("Search and filter skills with pagination (public endpoint like Udemy)")
            .WithTags("Skills")
            .AllowAnonymous()
            .Produces<PagedResponse<SkillSearchResultResponse>>(StatusCodes.Status200OK);

        skills.MapGet("/{id}", GetSkillById)
            .WithName("GetSkillDetails")
            .WithSummary("Get skill details")
            .WithDescription("Get detailed information about a specific skill (public endpoint like Udemy)")
            .WithTags("SkillDetail")
            .AllowAnonymous()
            .Produces<ApiResponse<SkillDetailsResponse>>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status400BadRequest);

        skills.MapGet("/my-skills", GetUserSkills)
            .WithName("GetUserSkills")
            .WithSummary("Get user skills")
            .WithDescription("Retrieve all skills for a specific user with pagination")
            .WithTags("UserSkills")
            .Produces<PagedResponse<UserSkillResponse>>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .RequireAuthorization();

        skills.MapGet("/user/{userId}", GetSkillsByUserId)
            .WithName("GetSkillsByUserId")
            .WithSummary("Get skills by user ID")
            .WithDescription("Retrieve all skills for a specific user (requires authentication)")
            .WithTags("UserSkills")
            .Produces<PagedResponse<UserSkillResponse>>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .RequireAuthorization();

        // Public endpoint for skill counts (used by UserService for public profiles)
        skills.MapGet("/user/{userId}/counts", GetUserSkillCounts)
            .WithName("GetUserSkillCounts")
            .WithSummary("Get user skill counts")
            .WithDescription("Get count of offered and requested skills for a user (public endpoint for service-to-service calls)")
            .WithTags("UserSkills")
            .AllowAnonymous()
            .Produces<ApiResponse<UserSkillCountsResponse>>(StatusCodes.Status200OK);

        skills.MapPost("/", CreateNewSkill)
            .WithName("CreateSkill")
            .WithSummary("Create a new skill")
            .WithDescription("Create a new skill with the specified details")
            .WithTags("Skills")
            .Produces<ApiResponse<CreateSkillResponse>>(StatusCodes.Status201Created)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .RequireAuthorization();

        skills.MapPut("/{id}", UpdateSkill)
            .WithName("UpdateSkill")
            .WithSummary("Update an existing skill")
            .WithDescription("Update the details of an existing skill by ID")
            .WithTags("Skill")
            .Produces<ApiResponse<UpdateSkillResponse>>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .RequireAuthorization();

        skills.MapDelete("/{id}", DeleteSkill)
            .WithName("DeleteSkill")
            .WithSummary("Delete a skill")
            .WithDescription("Delete a specific skill by ID")
            .WithTags("Skill")
            .Produces<ApiResponse<DeleteSkillResponse>>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .RequireAuthorization();

        skills.MapPost("/{id}/rate", RateSkill)
            .WithName("RateSkill")
            .WithSummary("Rate a skill")
            .WithDescription("Rate a specific skill by ID")
            .WithTags("Skill")
            .Produces<ApiResponse<RateSkillResponse>>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .RequireAuthorization();

        skills.MapPost("/{id}/endorse", EndorseSkill)
            .WithName("EndorseSkill")
            .WithSummary("Endorse a skill")
            .WithDescription("Endorse a specific skill by ID")
            .WithTags("Skill")
            .Produces<ApiResponse<EndorseSkillResponse>>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .RequireAuthorization();

        static async Task<IResult> SearchSkills(
            IMediator mediator,
            ClaimsPrincipal user,
            [AsParameters] SearchSkillsRequest request)
        {
            var userId = user.GetUserId() ?? string.Empty;

            var query = new SearchSkillsQuery(
                userId,
                request.SearchTerm,
                request.CategoryId,
                request.Tags?.ToList(),
                request.IsOffered,
                request.MinRating,
                request.SortBy,
                request.SortDescending,
                request.PageNumber,
                request.PageSize,
                request.LocationType,
                request.MaxDistanceKm,
                request.UserLatitude,
                request.UserLongitude);

            return await mediator.SendQuery(query);
        }

        static async Task<IResult> GetSkillById(
            IMediator mediator,
            ClaimsPrincipal user,
            [FromRoute] string id)
        {
            var userId = user.GetUserId() ?? string.Empty;
            var query = new GetSkillDetailsQuery(id);
            return await mediator.SendQuery(query);
        }

        static async Task<IResult> GetUserSkills(IMediator mediator, ClaimsPrincipal user, [AsParameters] GetUserSkillsRequest request)
        {
            var userId = user.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var query = new GetUserSkillsQuery(userId, request.IsOffered, request.CategoryId, request.LocationType, request.IncludeInactive, request.PageNumber, request.PageSize);

            return await mediator.SendQuery(query);
        }

        static async Task<IResult> GetSkillsByUserId(
            IMediator mediator,
            ClaimsPrincipal user,
            [FromRoute] string userId,
            [AsParameters] GetUserSkillsRequest request)
        {
            // Public profile: Only show active skills (IncludeInactive = false)
            var query = new GetUserSkillsQuery(
                userId,
                request.IsOffered,
                request.CategoryId,
                request.LocationType,
                false, // Always exclude inactive for public profile
                request.PageNumber,
                request.PageSize);

            return await mediator.SendQuery(query);
        }

        static async Task<IResult> GetUserSkillCounts(
            IMediator mediator,
            [FromRoute] string userId)
        {
            var query = new GetUserSkillCountsQuery(userId);
            return await mediator.SendQuery(query);
        }

        static async Task<IResult> CreateNewSkill(IMediator mediator, ClaimsPrincipal user, [FromBody] CreateSkillRequest request)
        {
            var userId = user.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var command = new CreateSkillCommand(
                request.Name,
                request.Description,
                request.CategoryId,
                request.Tags,
                request.IsOffered,
                request.AvailableHours,
                request.PreferredSessionDuration,
                // Exchange options
                request.ExchangeType,
                request.DesiredSkillCategoryId,
                request.DesiredSkillDescription,
                request.HourlyRate,
                request.Currency,
                // Scheduling
                request.PreferredDays,
                request.PreferredTimes,
                request.SessionDurationMinutes,
                request.TotalSessions,
                // Location
                request.LocationType,
                request.LocationAddress,
                request.LocationCity,
                request.LocationPostalCode,
                request.LocationCountry,
                request.MaxDistanceKm)
            {
                UserId = userId
            };

            return await mediator.SendCommand(command);
        }

        static async Task<IResult> UpdateSkill(IMediator mediator, ClaimsPrincipal user, [FromRoute] string id, [FromBody] UpdateSkillRequest request)
        {
            var userId = user.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var command = new UpdateSkillCommand(
                id,
                request.Name,
                request.Description,
                request.CategoryId,
                request.Tags,
                request.IsOffered,
                request.AvailableHours,
                request.PreferredSessionDuration)
            {
                UserId = userId
            };

            return await mediator.SendCommand(command);
        }

        static async Task<IResult> DeleteSkill(IMediator mediator, ClaimsPrincipal user, [FromRoute] string id, [FromBody] DeleteSkillRequest request)
        {
            var userId = user.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var command = new DeleteSkillCommand(id, request.Reason)
            {
                UserId = userId
            };

            return await mediator.SendCommand(command);
        }

        static async Task<IResult> RateSkill(IMediator mediator, ClaimsPrincipal user, [FromRoute] string id, [FromBody] RateSkillRequest request)
        {
            var userId = user.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var command = new RateSkillCommand(id, request.Rating, request.Comment, request.Tags)
            {
                UserId = userId
            };

            return await mediator.SendCommand(command);
        }

        static async Task<IResult> EndorseSkill(IMediator mediator, ClaimsPrincipal user, [FromRoute] string id, [FromBody] EndorseSkillRequest request)
        {
            var userId = user.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var command = new EndorseSkillCommand(id, request.EndorsedUserId, request.Comment)
            {
                UserId = userId
            };

            return await mediator.SendCommand(command);
        }

        #endregion

        #region Categories Endpoints
        RouteGroupBuilder categories = skills.MapGroup("/categories");

        categories.MapGet("/", GetCategories)
            .WithName("GetSkillCategories")
            .WithSummary("Get skill categories")
            .WithDescription("Retrieve all skill categories with pagination (public endpoint)")
            .WithTags("SkillCategories")
            .AllowAnonymous()
            .Produces<ApiResponse<GetSkillCategoriesResponse>>(StatusCodes.Status200OK);

        categories.MapPost("/", CreateNewCategory)
            .WithName("CreateSkillCategory")
            .WithSummary("Create a new skill category")
            .WithDescription("Create a new skill category with the specified details")
            .WithTags("SkillCategories")
            .Produces<ApiResponse<CreateSkillCategoryResponse>>(StatusCodes.Status201Created)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .RequireAuthorization(Policies.RequireAdminRole);

        // TODO: Implement UpdateSkillCategoryCommand first
        // categories.MapPut("/{id}", UpdateCategory)
        //     .WithName("UpdateSkillCategory")
        //     .WithSummary("Update an existing skill category")
        //     .WithDescription("Update an existing skill category with the specified details")
        //     .WithTags("SkillCategories")
        //     .Produces<ApiResponse<UpdateSkillCategoryResponse>>(StatusCodes.Status200OK)
        //     .ProducesProblem(StatusCodes.Status401Unauthorized)
        //     .ProducesProblem(StatusCodes.Status404NotFound)
        //     .RequireAuthorization(Policies.RequireAdminRole);

        static async Task<IResult> GetCategories(
            IMediator mediator)
        {
            var query = new GetSkillCategoriesQuery();

            return await mediator.SendQuery(query);
        }

        static async Task<IResult> CreateNewCategory(IMediator mediator, ClaimsPrincipal user, [FromBody] CreateSkillCategoryRequest request)
        {
            var userId = user.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var command = new CreateSkillCategoryCommand(request.Name, request.Description, request.IconName, request.Color, request.SortOrder, request.IsActive)
            {
                UserId = userId
            };

            return await mediator.SendCommand(command);
        }

        // TODO: Implement UpdateSkillCategoryCommand first
        // static async Task<IResult> UpdateCategory(IMediator mediator, ClaimsPrincipal user, [FromRoute] string id, [FromBody] UpdateSkillCategoryRequest request)
        // {
        //     var userId = user.GetUserId();
        //     if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();
        //
        //     var command = new UpdateSkillCategoryCommand(id, request.Name, request.Description, request.IconName, request.Color, request.SortOrder, request.IsActive)
        //     {
        //         UserId = userId
        //     };
        //
        //     return await mediator.SendCommand(command);
        // }
        #endregion

        #region Analytics
        RouteGroupBuilder analytics = skills.MapGroup("/analytics");

        analytics.MapGet("/statistics", GetSkillStatistics)
            .WithName("GetSkillStatistics")
            .WithSummary("Get skill statistics")
            .WithDescription("Retrieve overall skill statistics including counts, ratings, and endorsements")
            .WithTags("Analytics")
            .Produces<GetSkillStatisticsResponse>(StatusCodes.Status200OK);

        analytics.MapGet("/popular-tags", GetPopularTags)
            .WithName("GetPopularTags")
            .WithSummary("Get popular tags")
            .WithDescription("Retrieve a list of popular tags based on user interactions (public endpoint)")
            .WithTags("Analytics")
            .AllowAnonymous()
            .Produces<GetPopularTagsResponse>(StatusCodes.Status200OK);

        RouteGroupBuilder rec = skills.MapGroup("/recommendations")
            .RequireAuthorization();

        rec.MapGet("/", GetSkillRecommendations)
            .WithName("GetSkillRecommendations")
            .WithSummary("Get skill recommendations")
            .WithDescription("Retrieve personalized skill recommendations for the user")
            .WithTags("Recommendations")
            .Produces<GetSkillRecommendationsResponse>(StatusCodes.Status200OK);

        static async Task<IResult> GetSkillStatistics(IMediator mediator, ClaimsPrincipal user, [AsParameters] GetSkillStatisticsRequest request)
        {
            var userId = user.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var query = new GetSkillStatisticsQuery(request.FromDate, request.ToDate, request.CategoryId, request.UserId);

            return await mediator.SendQuery(query);
        }

        static async Task<IResult> GetPopularTags(IMediator mediator, ClaimsPrincipal user, [AsParameters] GetPopularTagsRequest request)
        {
            var query = new GetPopularTagsQuery(request.CategoryId, request.MaxTags, request.MinUsageCount);
            return await mediator.SendQuery(query);
        }

        static async Task<IResult> GetSkillRecommendations(IMediator mediator, ClaimsPrincipal user, [AsParameters] GetSkillRecommendationsRequest request)
        {
            var userId = user.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var query = new GetSkillRecommendationsQuery(request.UserId, request.MaxRecommendations);

            return await mediator.SendQuery(query);
        }

        #endregion

        #region Favorites Endpoints
        RouteGroupBuilder favorites = skills.MapGroup("/favorites")
            .RequireAuthorization();

        favorites.MapGet("/", GetFavoriteSkills)
            .WithName("GetFavoriteSkills")
            .WithSummary("Get favorite skills")
            .WithDescription("Retrieve the user's favorite skills with pagination")
            .WithTags("Favorites")
            .Produces<PagedResponse<SkillSearchResultResponse>>(StatusCodes.Status200OK);

        skills.MapPost("/{id}/favorite", AddFavorite)
            .WithName("AddFavorite")
            .WithSummary("Add skill to favorites")
            .WithDescription("Add a skill to the user's favorites")
            .WithTags("Favorites")
            .Produces<ApiResponse<AddFavoriteResponse>>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .RequireAuthorization();

        skills.MapDelete("/{id}/favorite", RemoveFavorite)
            .WithName("RemoveFavorite")
            .WithSummary("Remove skill from favorites")
            .WithDescription("Remove a skill from the user's favorites")
            .WithTags("Favorites")
            .Produces<ApiResponse<RemoveFavoriteResponse>>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .RequireAuthorization();

        skills.MapGet("/{id}/is-favorite", IsFavorite)
            .WithName("IsFavorite")
            .WithSummary("Check if skill is favorited")
            .WithDescription("Check if a skill is in the user's favorites")
            .WithTags("Favorites")
            .Produces<ApiResponse<IsFavoriteResponse>>(StatusCodes.Status200OK)
            .RequireAuthorization();

        static async Task<IResult> GetFavoriteSkills(
            IMediator mediator,
            ClaimsPrincipal user,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 20)
        {
            var userId = user.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var query = new GetFavoriteSkillsQuery(userId, pageNumber, pageSize);

            return await mediator.SendQuery(query);
        }

        static async Task<IResult> AddFavorite(
            IMediator mediator,
            ClaimsPrincipal user,
            [FromRoute] string id)
        {
            var userId = user.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var command = new AddFavoriteCommand(id)
            {
                UserId = userId
            };

            return await mediator.SendCommand(command);
        }

        static async Task<IResult> RemoveFavorite(
            IMediator mediator,
            ClaimsPrincipal user,
            [FromRoute] string id)
        {
            var userId = user.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var command = new RemoveFavoriteCommand(id)
            {
                UserId = userId
            };

            return await mediator.SendCommand(command);
        }

        static async Task<IResult> IsFavorite(
            IMediator mediator,
            ClaimsPrincipal user,
            [FromRoute] string id)
        {
            var userId = user.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var query = new IsFavoriteQuery(userId, id);

            return await mediator.SendQuery(query);
        }
        #endregion

        return skills;

    }
}