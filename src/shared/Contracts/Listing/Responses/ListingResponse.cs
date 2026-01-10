namespace Contracts.Listing.Responses;

/// <summary>
/// API response for a listing
/// Phase 10: Listing concept with expiration
/// </summary>
public record ListingResponse(
    string Id,
    string SkillId,
    string UserId,
    string Type,
    string Status,
    DateTime ExpiresAt,
    DateTime? RefreshedAt,
    int RefreshCount,
    int RefreshesRemaining,
    bool IsBoosted,
    DateTime? BoostedUntil,
    int BoostCount,
    DateTime CreatedAt,
    DateTime? UpdatedAt,
    // Computed fields
    bool IsVisible,
    int DaysUntilExpiration,
    bool IsCurrentlyBoosted,
    // Nested skill summary
    ListingSkillSummary? Skill = null)
{
    public string ApiVersion => "v1";
}

/// <summary>
/// Summary of skill information for listing responses
/// </summary>
public record ListingSkillSummary(
    string Id,
    string Name,
    string Description,
    string TopicId,
    string TopicName,
    string SubcategoryId,
    string SubcategoryName,
    string CategoryId,
    string CategoryName,
    string LocationType,
    string? LocationCity,
    double? AverageRating,
    int ReviewCount,
    int ViewCount,
    List<string>? Tags);
