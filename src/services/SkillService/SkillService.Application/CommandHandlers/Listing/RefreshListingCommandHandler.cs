using CQRS.Handlers;
using CQRS.Models;
using Contracts.Listing.Responses;
using Core.Common.Exceptions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SkillService.Application.Commands.Listing;
using SkillService.Domain.Entities;
using SkillService.Domain.Repositories;
using SkillService.Domain.Configuration;

namespace SkillService.Application.CommandHandlers.Listing;

/// <summary>
/// Handler for refreshing a listing (extending expiration)
/// </summary>
public class RefreshListingCommandHandler(
    ISkillUnitOfWork unitOfWork,
    IOptions<ListingSettings> options,
    ILogger<RefreshListingCommandHandler> logger)
    : BaseCommandHandler<RefreshListingCommand, ListingResponse>(logger)
{
    private readonly ISkillUnitOfWork _unitOfWork = unitOfWork;
    private readonly ListingSettings _settings = options.Value;

    public override async Task<ApiResponse<ListingResponse>> Handle(
        RefreshListingCommand request,
        CancellationToken cancellationToken)
    {
        var listing = await _unitOfWork.Listings.GetByIdWithSkillAsync(request.ListingId, cancellationToken)
            ?? throw new ResourceNotFoundException("Listing", request.ListingId);

        // Verify ownership
        if (listing.UserId != request.UserId)
        {
            return Error("You can only refresh your own listings", ErrorCodes.InsufficientPermissions);
        }

        // Check if can refresh
        if (!listing.CanRefresh)
        {
            return Error(
                $"Cannot refresh listing. Maximum refresh count ({Domain.Entities.Listing.MaxRefreshCount}) reached.",
                ErrorCodes.BusinessRuleViolation);
        }

        // Check if listing is deleted
        if (listing.Status == ListingStatus.Deleted)
        {
            return Error("Cannot refresh a deleted listing", ErrorCodes.BusinessRuleViolation);
        }

        // Refresh the listing
        var success = listing.Refresh(_settings.DefaultExpirationMinutes);
        if (!success)
        {
            return Error("Failed to refresh listing", ErrorCodes.BusinessRuleViolation);
        }

        await _unitOfWork.Listings.UpdateAsync(listing, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        Logger.LogInformation(
            "Refreshed listing {ListingId}, new expiration {ExpiresAt}, refresh count {RefreshCount}",
            listing.Id, listing.ExpiresAt, listing.RefreshCount);

        return Success(ListingMapper.MapToResponse(listing), "Listing refreshed successfully");
    }
}
