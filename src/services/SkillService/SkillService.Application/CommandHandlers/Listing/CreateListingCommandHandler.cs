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
/// Handler for creating a new listing
/// </summary>
public class CreateListingCommandHandler(
    ISkillUnitOfWork unitOfWork,
    IOptions<ListingSettings> options,
    ILogger<CreateListingCommandHandler> logger)
    : BaseCommandHandler<CreateListingCommand, ListingResponse>(logger)
{
    private readonly ISkillUnitOfWork _unitOfWork = unitOfWork;
    private readonly ListingSettings _settings = options.Value;

    public override async Task<ApiResponse<ListingResponse>> Handle(
        CreateListingCommand request,
        CancellationToken cancellationToken)
    {
        // Validate skill exists and belongs to user
        var skill = await _unitOfWork.Skills.GetByIdAsync(request.SkillId, cancellationToken)
            ?? throw new ResourceNotFoundException("Skill", request.SkillId);

        if (skill.UserId != request.UserId)
        {
            return Error("You can only create listings for your own skills", ErrorCodes.InsufficientPermissions);
        }

        // Check if listing already exists for this skill
        var existingListing = await _unitOfWork.Listings.GetActiveBySkillIdAsync(request.SkillId, cancellationToken);
        if (existingListing != null)
        {
            return Error("An active listing already exists for this skill", ErrorCodes.BusinessRuleViolation);
        }

        // Create listing with configured expiration time
        var listing = Domain.Entities.Listing.Create(
            request.SkillId,
            request.UserId!,
            request.Type,
            _settings.DefaultExpirationMinutes);

        await _unitOfWork.Listings.CreateAsync(listing, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // Load the listing with skill for response
        var createdListing = await _unitOfWork.Listings.GetByIdWithSkillAsync(listing.Id, cancellationToken);

        Logger.LogInformation(
            "Created listing {ListingId} for skill {SkillId}, expires at {ExpiresAt}",
            listing.Id, request.SkillId, listing.ExpiresAt);

        return Success(MapToResponse(createdListing!), "Listing created successfully");
    }

    private static ListingResponse MapToResponse(Domain.Entities.Listing listing)
    {
        ListingSkillSummary? skillSummary = null;

        if (listing.Skill != null)
        {
            var skill = listing.Skill;
            skillSummary = new ListingSkillSummary(
                Id: skill.Id,
                Name: skill.Name,
                Description: skill.Description,
                TopicId: skill.SkillTopicId,
                TopicName: skill.Topic?.Name ?? "",
                SubcategoryId: skill.Topic?.SkillSubcategoryId ?? "",
                SubcategoryName: skill.Topic?.Subcategory?.Name ?? "",
                CategoryId: skill.Topic?.Subcategory?.SkillCategoryId ?? "",
                CategoryName: skill.Topic?.Subcategory?.Category?.Name ?? "",
                LocationType: skill.LocationType,
                LocationCity: skill.LocationCity,
                AverageRating: skill.AverageRating,
                ReviewCount: skill.ReviewCount,
                ViewCount: skill.ViewCount,
                Tags: skill.Tags);
        }

        return new ListingResponse(
            Id: listing.Id,
            SkillId: listing.SkillId,
            UserId: listing.UserId,
            Type: listing.Type,
            Status: listing.Status,
            ExpiresAt: listing.ExpiresAt,
            RefreshedAt: listing.RefreshedAt,
            RefreshCount: listing.RefreshCount,
            RefreshesRemaining: listing.RefreshesRemaining,
            IsBoosted: listing.IsBoosted,
            BoostedUntil: listing.BoostedUntil,
            BoostCount: listing.BoostCount,
            CreatedAt: listing.CreatedAt,
            UpdatedAt: listing.UpdatedAt,
            IsVisible: listing.IsVisible,
            DaysUntilExpiration: listing.DaysUntilExpiration,
            IsCurrentlyBoosted: listing.IsCurrentlyBoosted,
            Skill: skillSummary);
    }
}
