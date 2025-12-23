using CQRS.Interfaces;
using FluentValidation;

namespace SkillService.Application.Queries;

// ============================================================================
// GET POPULAR TAGS QUERY
// ============================================================================

public record GetPopularTagsQuery(
    string? CategoryId = null,
    int MaxTags = 50,
    int MinUsageCount = 1)
    : IQuery<List<PopularTagResponse>>, ICacheableQuery
{
    public string CacheKey => $"popular-tags:{CategoryId}:{MaxTags}:{MinUsageCount}";
    public TimeSpan CacheDuration => TimeSpan.FromMinutes(20);
}

public record PopularTagResponse(
    string Tag,
    int UsageCount,
    string? CategoryId,
    string? CategoryName,
    double GrowthRate);

public class GetPopularTagsQueryValidator : AbstractValidator<GetPopularTagsQuery>
{
    public GetPopularTagsQueryValidator()
    {
        RuleFor(x => x.MaxTags)
            .InclusiveBetween(1, 200).WithMessage("Max tags must be between 1 and 200");

        RuleFor(x => x.MinUsageCount)
            .GreaterThanOrEqualTo(1).WithMessage("Min usage count must be at least 1");
    }
}
