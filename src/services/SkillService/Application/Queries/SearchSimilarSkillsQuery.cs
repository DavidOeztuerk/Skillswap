using CQRS.Interfaces;
using FluentValidation;

namespace SkillService.Application.Queries;

// ============================================================================
// SEARCH SIMILAR SKILLS QUERY
// ============================================================================

public record SearchSimilarSkillsQuery(
    string SkillId,
    int MaxResults = 10,
    double MinSimilarityScore = 0.5)
    : IQuery<List<SimilarSkillResponse>>, ICacheableQuery
{
    public string CacheKey => $"similar-skills:{SkillId}:{MaxResults}:{MinSimilarityScore}";
    public TimeSpan CacheDuration => TimeSpan.FromMinutes(15);
}

public record SimilarSkillResponse(
    string SkillId,
    string UserId,
    string UserName,
    string Name,
    string Description,
    SkillCategoryResponse Category,
    double SimilarityScore,
    List<string> CommonTags,
    double? AverageRating,
    bool IsRemoteAvailable);

public class SearchSimilarSkillsQueryValidator : AbstractValidator<SearchSimilarSkillsQuery>
{
    public SearchSimilarSkillsQueryValidator()
    {
        RuleFor(x => x.SkillId)
            .NotEmpty().WithMessage("Skill ID is required");

        RuleFor(x => x.MaxResults)
            .InclusiveBetween(1, 50).WithMessage("Max results must be between 1 and 50");

        RuleFor(x => x.MinSimilarityScore)
            .InclusiveBetween(0.0, 1.0).WithMessage("Min similarity score must be between 0 and 1");
    }
}
