using System.Security.Claims;
using Contracts.Listing.Requests;
using Contracts.Listing.Responses;
using CQRS.Extensions;
using CQRS.Models;
using Infrastructure.Extensions;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using SkillService.Application.Commands.Listing;
using SkillService.Application.Queries.Listing;

namespace SkillService.Extensions;

/// <summary>
/// Listing endpoints using Minimal API
/// Phase 10: Listing concept with expiration
/// </summary>
public static class ListingControllerExtensions
{
  public static RouteGroupBuilder MapListingController(this IEndpointRouteBuilder builder)
  {
    RouteGroupBuilder listings = builder.MapGroup("/listings");

    // =============================================
    // Public Endpoints
    // =============================================

    listings.MapGet("/", SearchListings)
        .WithName("SearchListings")
        .WithSummary("Search listings")
        .WithDescription("Search and filter active listings with pagination (public endpoint)")
        .WithTags("Listings")
        .AllowAnonymous()
        .Produces<PagedResponse<ListingResponse>>(StatusCodes.Status200OK);

    listings.MapGet("/featured", GetFeaturedListings)
        .WithName("GetFeaturedListings")
        .WithSummary("Get featured listings for homepage")
        .WithDescription("Get top listings sorted by boost status, rating, and popularity (public endpoint, Phase 15)")
        .WithTags("Listings")
        .AllowAnonymous()
        .Produces<ApiResponse<List<ListingResponse>>>(StatusCodes.Status200OK);

    listings.MapGet("/{id}", GetListingById)
        .WithName("GetListingDetails")
        .WithSummary("Get listing details")
        .WithDescription("Get detailed information about a specific listing (public endpoint)")
        .WithTags("Listings")
        .AllowAnonymous()
        .Produces<ApiResponse<ListingResponse>>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status404NotFound);

    // =============================================
    // Authenticated Endpoints
    // =============================================

    listings.MapGet("/my-listings", GetMyListings)
        .WithName("GetMyListings")
        .WithSummary("Get user's listings")
        .WithDescription("Retrieve all listings for the current user")
        .WithTags("Listings")
        .Produces<ApiResponse<List<ListingResponse>>>(StatusCodes.Status200OK)
        .RequireAuthorization();

    listings.MapPost("/", CreateListing)
        .WithName("CreateListing")
        .WithSummary("Create a new listing")
        .WithDescription("Create a new listing for a skill")
        .WithTags("Listings")
        .Produces<ApiResponse<ListingResponse>>(StatusCodes.Status201Created)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .RequireAuthorization();

    listings.MapPost("/{id}/refresh", RefreshListing)
        .WithName("RefreshListing")
        .WithSummary("Refresh a listing")
        .WithDescription("Extend the expiration of a listing (max 5 refreshes)")
        .WithTags("Listings")
        .Produces<ApiResponse<ListingResponse>>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status404NotFound)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .RequireAuthorization();

    listings.MapPost("/{id}/boost", BoostListing)
        .WithName("BoostListing")
        .WithSummary("Boost a listing")
        .WithDescription("Boost a listing for higher visibility")
        .WithTags("Listings")
        .Produces<ApiResponse<ListingResponse>>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status404NotFound)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .RequireAuthorization();

    listings.MapPost("/{id}/close", CloseListing)
        .WithName("CloseListing")
        .WithSummary("Close a listing")
        .WithDescription("Close a listing manually")
        .WithTags("Listings")
        .Produces<ApiResponse<ListingResponse>>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status404NotFound)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .RequireAuthorization();

    listings.MapDelete("/{id}", DeleteListing)
        .WithName("DeleteListing")
        .WithSummary("Delete a listing")
        .WithDescription("Delete a listing (soft delete)")
        .WithTags("Listings")
        .Produces<ApiResponse<bool>>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status404NotFound)
        .RequireAuthorization();

    // =============================================
    // Endpoint Handlers
    // =============================================

    static async Task<IResult> SearchListings(
        IMediator mediator,
        ClaimsPrincipal user,
        [AsParameters] SearchListingsRequest request)
    {
      // Parse comma-separated tags
      var tags = string.IsNullOrWhiteSpace(request.Tags)
          ? null
          : request.Tags.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).ToList();

      var query = new SearchListingsQuery(
          SearchTerm: request.SearchTerm,
          CategoryId: request.CategoryId,
          TopicId: request.TopicId,
          ListingType: request.ListingType,
          Tags: tags,
          MinRating: request.MinRating,
          LocationType: request.LocationType,
          MaxDistanceKm: request.MaxDistanceKm,
          UserLatitude: request.UserLatitude,
          UserLongitude: request.UserLongitude,
          BoostedOnly: request.BoostedOnly,
          SortBy: request.SortBy,
          SortDirection: request.SortDirection,
          PageNumber: request.PageNumber,
          PageSize: request.PageSize);

      var result = await mediator.Send(query);
      return Results.Ok(result);
    }

    static async Task<IResult> GetFeaturedListings(
        IMediator mediator,
        [FromQuery] int limit = 6)
    {
      var query = new GetFeaturedListingsQuery(limit);
      return await mediator.SendQuery(query);
    }

    static async Task<IResult> GetListingById(
        IMediator mediator,
        [FromRoute] string id)
    {
      var query = new GetListingQuery(id);
      return await mediator.SendQuery(query);
    }

    static async Task<IResult> GetMyListings(
        IMediator mediator,
        ClaimsPrincipal user,
        [AsParameters] GetUserListingsRequest request)
    {
      var userId = user.GetUserId();
      if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

      var query = new GetUserListingsQuery(request.IncludeExpired)
      {
        UserId = userId
      };

      return await mediator.SendQuery(query);
    }

    static async Task<IResult> CreateListing(
        IMediator mediator,
        ClaimsPrincipal user,
        [FromBody] CreateListingRequest request)
    {
      var userId = user.GetUserId();
      if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

      var command = new CreateListingCommand(request.SkillId, request.Type)
      {
        UserId = userId
      };

      return await mediator.SendCommand(command);
    }

    static async Task<IResult> RefreshListing(
        IMediator mediator,
        ClaimsPrincipal user,
        [FromRoute] string id)
    {
      var userId = user.GetUserId();
      if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

      var command = new RefreshListingCommand(id)
      {
        UserId = userId
      };

      return await mediator.SendCommand(command);
    }

    static async Task<IResult> BoostListing(
        IMediator mediator,
        ClaimsPrincipal user,
        [FromRoute] string id,
        [FromBody] BoostListingRequest? request = null)
    {
      var userId = user.GetUserId();
      if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

      var command = new BoostListingCommand(id, request?.DurationDays)
      {
        UserId = userId
      };

      return await mediator.SendCommand(command);
    }

    static async Task<IResult> CloseListing(
        IMediator mediator,
        ClaimsPrincipal user,
        [FromRoute] string id,
        [FromBody] CloseListingRequest? request = null)
    {
      var userId = user.GetUserId();
      if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

      var command = new CloseListingCommand(id, request?.Reason)
      {
        UserId = userId
      };

      return await mediator.SendCommand(command);
    }

    static async Task<IResult> DeleteListing(
        IMediator mediator,
        ClaimsPrincipal user,
        [FromRoute] string id)
    {
      var userId = user.GetUserId();
      if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

      var command = new DeleteListingCommand(id)
      {
        UserId = userId
      };

      return await mediator.SendCommand(command);
    }

    return listings;
  }
}
