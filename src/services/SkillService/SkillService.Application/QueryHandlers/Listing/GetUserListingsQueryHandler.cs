using CQRS.Handlers;
using CQRS.Models;
using Contracts.Listing.Responses;
using Microsoft.Extensions.Logging;
using SkillService.Application.CommandHandlers.Listing;
using SkillService.Application.Queries.Listing;
using SkillService.Domain.Repositories;

namespace SkillService.Application.QueryHandlers.Listing;

/// <summary>
/// Handler for getting user's listings
/// </summary>
public class GetUserListingsQueryHandler(
    ISkillUnitOfWork unitOfWork,
    ILogger<GetUserListingsQueryHandler> logger)
    : BaseQueryHandler<GetUserListingsQuery, List<ListingResponse>>(logger)
{
    private readonly ISkillUnitOfWork _unitOfWork = unitOfWork;

    public override async Task<ApiResponse<List<ListingResponse>>> Handle(
        GetUserListingsQuery request,
        CancellationToken cancellationToken)
    {
        var listings = await _unitOfWork.Listings.GetByUserIdAsync(
            request.UserId!,
            request.IncludeExpired,
            cancellationToken);

        var response = ListingMapper.MapToResponseList(listings);

        return Success(response);
    }
}
