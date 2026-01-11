using CQRS.Models;
using Contracts.Listing.Responses;
using MediatR;
using Microsoft.Extensions.Logging;
using SkillService.Application.CommandHandlers.Listing;
using SkillService.Application.Queries.Listing;
using SkillService.Domain.Repositories;

namespace SkillService.Application.QueryHandlers.Listing;

/// <summary>
/// Handler for searching listings with filters and pagination
/// </summary>
public class SearchListingsQueryHandler(
    ISkillUnitOfWork unitOfWork,
    ILogger<SearchListingsQueryHandler> logger)
    : IRequestHandler<SearchListingsQuery, PagedResponse<ListingResponse>>
{
  private readonly ISkillUnitOfWork _unitOfWork = unitOfWork;
  private readonly ILogger<SearchListingsQueryHandler> _logger = logger;

  public async Task<PagedResponse<ListingResponse>> Handle(
      SearchListingsQuery request,
      CancellationToken cancellationToken)
  {
    _logger.LogDebug(
        "Searching listings: term={SearchTerm}, type={Type}, page={Page}, size={Size}",
        request.SearchTerm, request.ListingType, request.PageNumber, request.PageSize);

    var (listings, totalCount) = await _unitOfWork.Listings.SearchListingsPagedAsync(
        searchTerm: request.SearchTerm,
        categoryId: request.CategoryId,
        topicId: request.TopicId,
        tags: request.Tags,
        listingType: request.ListingType,
        minRating: request.MinRating,
        sortBy: request.SortBy,
        sortDirection: request.SortDirection,
        pageNumber: request.PageNumber,
        pageSize: request.PageSize,
        locationType: request.LocationType,
        maxDistanceKm: request.MaxDistanceKm,
        userLatitude: request.UserLatitude,
        userLongitude: request.UserLongitude,
        boostedOnly: request.BoostedOnly,
        cancellationToken: cancellationToken);

    var responseItems = ListingMapper.MapToResponseList(listings);

    _logger.LogDebug("Found {Count} listings out of {Total}", responseItems.Count, totalCount);

    return PagedResponse<ListingResponse>.Create(
        responseItems,
        request.PageNumber,
        request.PageSize,
        totalCount,
        "Listings retrieved successfully");
  }
}
