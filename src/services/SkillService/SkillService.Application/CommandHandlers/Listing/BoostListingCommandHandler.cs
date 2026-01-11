using CQRS.Handlers;
using CQRS.Models;
using Contracts.Listing.Responses;
using Core.Common.Exceptions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SkillService.Application.Commands.Listing;
using SkillService.Domain.Repositories;
using SkillService.Domain.Configuration;

namespace SkillService.Application.CommandHandlers.Listing;

/// <summary>
/// Handler for boosting a listing for higher visibility
/// </summary>
public class BoostListingCommandHandler(
    ISkillUnitOfWork unitOfWork,
    IOptions<ListingSettings> options,
    ILogger<BoostListingCommandHandler> logger)
    : BaseCommandHandler<BoostListingCommand, ListingResponse>(logger)
{
    private readonly ISkillUnitOfWork _unitOfWork = unitOfWork;
    private readonly ListingSettings _settings = options.Value;

    public override async Task<ApiResponse<ListingResponse>> Handle(
        BoostListingCommand request,
        CancellationToken cancellationToken)
    {
        var listing = await _unitOfWork.Listings.GetByIdWithSkillAsync(request.ListingId, cancellationToken)
            ?? throw new ResourceNotFoundException("Listing", request.ListingId);

        // Verify ownership
        if (listing.UserId != request.UserId)
        {
            return Error("You can only boost your own listings", ErrorCodes.InsufficientPermissions);
        }

        // Check if listing is active
        if (!listing.IsVisible)
        {
            return Error("Cannot boost an inactive or expired listing", ErrorCodes.BusinessRuleViolation);
        }

        // Calculate boost duration in minutes
        var durationMinutes = request.DurationDays.HasValue
            ? request.DurationDays.Value * 24 * 60
            : _settings.DefaultBoostDurationMinutes;

        // Apply boost
        listing.Boost(durationMinutes);

        await _unitOfWork.Listings.UpdateAsync(listing, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        Logger.LogInformation(
            "Boosted listing {ListingId} until {BoostedUntil}, total boosts {BoostCount}",
            listing.Id, listing.BoostedUntil, listing.BoostCount);

        return Success(ListingMapper.MapToResponse(listing), "Listing boosted successfully");
    }
}
