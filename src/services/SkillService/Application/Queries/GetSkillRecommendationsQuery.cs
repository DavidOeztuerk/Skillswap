using CQRS.Interfaces;
using FluentValidation;

namespace SkillService.Application.Queries;

// ============================================================================
// GET SKILL RECOMMENDATIONS QUERY
// ============================================================================

public record GetSkillRecommendationsQuery(
    string UserId,
    int MaxRecommendations = 10,
    bool OnlyRemote = false,
    string? PreferredLocation = null)
    : IQuery<List<SkillRecommendationResponse>>, ICacheableQuery
{
    public string CacheKey => $"skill-recommendations:{UserId}:{MaxRecommendations}:{OnlyRemote}:{PreferredLocation}";
    public TimeSpan CacheDuration => TimeSpan.FromMinutes(30);
}

public record SkillRecommendationResponse(
    string SkillId,
    string UserId,
    string Name,
    string Description,
    SkillCategoryResponse Category,
    double? AverageRating,
    string RecommendationReason,
    double CompatibilityScore,
    bool IsRemoteAvailable);

public class GetSkillRecommendationsQueryValidator : AbstractValidator<GetSkillRecommendationsQuery>
{
    public GetSkillRecommendationsQueryValidator()
    {
        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("User ID is required");

        RuleFor(x => x.MaxRecommendations)
            .InclusiveBetween(1, 50).WithMessage("Max recommendations must be between 1 and 50");

        RuleFor(x => x.PreferredLocation)
            .MaximumLength(200).WithMessage("Preferred location must not exceed 200 characters")
            .When(x => !string.IsNullOrEmpty(x.PreferredLocation));
    }
}
