using CQRS.Handlers;
using CQRS.Models;
using Core.Common.Exceptions;
using Microsoft.Extensions.Logging;
using SkillService.Application.Commands.Listing;
using SkillService.Domain.Repositories;

namespace SkillService.Application.CommandHandlers.Listing;

/// <summary>
/// Handler for deleting a listing
/// </summary>
public class DeleteListingCommandHandler(
    ISkillUnitOfWork unitOfWork,
    ILogger<DeleteListingCommandHandler> logger)
    : BaseCommandHandler<DeleteListingCommand, bool>(logger)
{
    private readonly ISkillUnitOfWork _unitOfWork = unitOfWork;

    public override async Task<ApiResponse<bool>> Handle(
        DeleteListingCommand request,
        CancellationToken cancellationToken)
    {
        var listing = await _unitOfWork.Listings.GetByIdAsync(request.ListingId, cancellationToken)
            ?? throw new ResourceNotFoundException("Listing", request.ListingId);

        // Verify ownership
        if (listing.UserId != request.UserId)
        {
            return Error("You can only delete your own listings", ErrorCodes.InsufficientPermissions);
        }

        // Soft delete the listing
        listing.SoftDelete(request.UserId);

        await _unitOfWork.Listings.UpdateAsync(listing, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        Logger.LogInformation("Soft-deleted listing {ListingId}", listing.Id);

        return Success(true, "Listing deleted successfully");
    }
}
