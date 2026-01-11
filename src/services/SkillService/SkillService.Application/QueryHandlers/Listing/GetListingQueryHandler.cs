using CQRS.Handlers;
using CQRS.Models;
using Contracts.Listing.Responses;
using Core.Common.Exceptions;
using Microsoft.Extensions.Logging;
using SkillService.Application.CommandHandlers.Listing;
using SkillService.Application.Queries.Listing;
using SkillService.Domain.Repositories;

namespace SkillService.Application.QueryHandlers.Listing;

/// <summary>
/// Handler for getting a listing by ID
/// </summary>
public class GetListingQueryHandler(
    ISkillUnitOfWork unitOfWork,
    ILogger<GetListingQueryHandler> logger)
    : BaseQueryHandler<GetListingQuery, ListingResponse>(logger)
{
  private readonly ISkillUnitOfWork _unitOfWork = unitOfWork;

  public override async Task<ApiResponse<ListingResponse>> Handle(
      GetListingQuery request,
      CancellationToken cancellationToken)
  {
    var listing = await _unitOfWork.Listings.GetByIdWithSkillAsync(request.ListingId, cancellationToken)
        ?? throw new ResourceNotFoundException("Listing", request.ListingId);

    return Success(ListingMapper.MapToResponse(listing));
  }
}
