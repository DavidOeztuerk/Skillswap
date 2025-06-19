using CQRS.Interfaces;
using FluentValidation;

namespace SkillService.Application.Queries;

// ============================================================================
// GET SKILL REVIEWS QUERY
// ============================================================================

public record GetSkillReviewsQuery(
    string SkillId,
    int? MinRating = null,
    string? SortBy = "newest",
    int PageNumber = 1,
    int PageSize = 10) 
    : IPagedQuery<SkillReviewResponse>, ICacheableQuery
{
    int IPagedQuery<SkillReviewResponse>.PageNumber { get; set; } = PageNumber;
    int IPagedQuery<SkillReviewResponse>.PageSize { get; set; } = PageSize;

    public string CacheKey => $"skill-reviews:{SkillId}:{MinRating}:{SortBy}:{PageNumber}:{PageSize}";
    public TimeSpan CacheDuration => TimeSpan.FromMinutes(10);
}

public class GetSkillReviewsQueryValidator : AbstractValidator<GetSkillReviewsQuery>
{
    public GetSkillReviewsQueryValidator()
    {
        RuleFor(x => x.SkillId)
            .NotEmpty().WithMessage("Skill ID is required");

        RuleFor(x => x.MinRating)
            .InclusiveBetween(1, 5).WithMessage("Min rating must be between 1 and 5")
            .When(x => x.MinRating.HasValue);

        RuleFor(x => x.SortBy)
            .Must(BeValidReviewSortField).WithMessage("Invalid sort field")
            .When(x => !string.IsNullOrEmpty(x.SortBy));

        RuleFor(x => x.PageNumber)
            .GreaterThan(0).WithMessage("Page number must be greater than 0");

        RuleFor(x => x.PageSize)
            .InclusiveBetween(1, 50).WithMessage("Page size must be between 1 and 50");
    }

    private static bool BeValidReviewSortField(string? sortBy)
    {
        if (string.IsNullOrEmpty(sortBy)) return true;

        var validSortFields = new[] { "newest", "oldest", "rating_high", "rating_low", "helpful" };
        return validSortFields.Contains(sortBy.ToLowerInvariant());
    }
}
