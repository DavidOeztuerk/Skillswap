using Contracts.Listing.Responses;
using CQRS.Handlers;
using CQRS.Models;
using Microsoft.Extensions.Logging;
using SkillService.Application.CommandHandlers.Listing;
using SkillService.Application.Queries.Listing;
using SkillService.Domain.Repositories;

namespace SkillService.Application.QueryHandlers.Listing;

/// <summary>
/// Handler for getting featured listings for homepage (Phase 15)
/// Sorted by: Boost status > Rating > Popularity > Recency
/// Public endpoint - no auth required
/// </summary>
public class GetFeaturedListingsQueryHandler(
    ISkillUnitOfWork unitOfWork,
    ILogger<GetFeaturedListingsQueryHandler> logger)
    : BaseQueryHandler<GetFeaturedListingsQuery, List<ListingResponse>>(logger)
{
  private readonly ISkillUnitOfWork _unitOfWork = unitOfWork;

  public override async Task<ApiResponse<List<ListingResponse>>> Handle(
      GetFeaturedListingsQuery request,
      CancellationToken cancellationToken)
  {
    Logger.LogDebug("Getting featured listings, limit={Limit}", request.Limit);

    var listings = await _unitOfWork.Listings.GetFeaturedListingsAsync(
        request.Limit,
        cancellationToken);

    var response = ListingMapper.MapToResponseList(listings);

    Logger.LogDebug("Found {Count} featured listings", response.Count);

    return Success(response);
  }
}
