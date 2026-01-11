using CQRS.Handlers;
using CQRS.Models;
using Contracts.Listing.Responses;
using Core.Common.Exceptions;
using Microsoft.Extensions.Logging;
using SkillService.Application.Commands.Listing;
using SkillService.Domain.Entities;
using SkillService.Domain.Repositories;

namespace SkillService.Application.CommandHandlers.Listing;

/// <summary>
/// Handler for closing a listing manually
/// </summary>
public class CloseListingCommandHandler(
    ISkillUnitOfWork unitOfWork,
    ILogger<CloseListingCommandHandler> logger)
    : BaseCommandHandler<CloseListingCommand, ListingResponse>(logger)
{
    private readonly ISkillUnitOfWork _unitOfWork = unitOfWork;

    public override async Task<ApiResponse<ListingResponse>> Handle(
        CloseListingCommand request,
        CancellationToken cancellationToken)
    {
        var listing = await _unitOfWork.Listings.GetByIdWithSkillAsync(request.ListingId, cancellationToken)
            ?? throw new ResourceNotFoundException("Listing", request.ListingId);

        // Verify ownership
        if (listing.UserId != request.UserId)
        {
            return Error("You can only close your own listings", ErrorCodes.InsufficientPermissions);
        }

        // Check if already closed or deleted
        if (listing.Status == ListingStatus.Closed)
        {
            return Error("Listing is already closed", ErrorCodes.BusinessRuleViolation);
        }

        if (listing.Status == ListingStatus.Deleted)
        {
            return Error("Cannot close a deleted listing", ErrorCodes.BusinessRuleViolation);
        }

        // Close the listing
        listing.Close(request.Reason);

        await _unitOfWork.Listings.UpdateAsync(listing, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        Logger.LogInformation(
            "Closed listing {ListingId}, reason: {Reason}",
            listing.Id, request.Reason ?? "Not specified");

        return Success(ListingMapper.MapToResponse(listing), "Listing closed successfully");
    }
}
