using Contracts.Listing.Responses;

namespace SkillService.Application.CommandHandlers.Listing;

/// <summary>
/// Helper class for mapping Listing entities to response DTOs
/// Phase 10: Listing concept with expiration
/// </summary>
public static class ListingMapper
{
    public static ListingResponse MapToResponse(Domain.Entities.Listing listing)
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

    public static List<ListingResponse> MapToResponseList(IEnumerable<Domain.Entities.Listing> listings)
    {
        return listings.Select(MapToResponse).ToList();
    }
}
