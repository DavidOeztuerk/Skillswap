using CQRS.Interfaces;
using FluentValidation;
using Contracts.Skill.Responses;

namespace SkillService.Application.Queries;

public record SearchSkillsQuery(
    string UserId,
    string? SearchTerm = null,
    string? CategoryId = null,
    string? ProficiencyLevelId = null,
    List<string>? Tags = null,
    bool? IsOffered = null,
    decimal? MinRating = null,
    string? SortBy = "CreatedAt",
    string SortDirection = "desc",
    int PageNumber = 1,
    int PageSize = 20)
    : IPagedQuery<SkillSearchResultResponse>, ICacheableQuery
{
    public int PageNumber { get; set; } = PageNumber;
    public int PageSize { get; set; } = PageSize;

    // Include UserId in cache key to ensure user-specific results are cached separately
    // This prevents users from getting cached results meant for other users
    public string CacheKey => $"skills-search:{UserId}:{SearchTerm ?? ""}:{CategoryId ?? ""}:{ProficiencyLevelId ?? ""}:{IsOffered?.ToString() ?? ""}:{(Tags != null && Tags.Count > 0 ? string.Join(",", Tags) : "")}:{PageNumber}:{PageSize}";
    public TimeSpan CacheDuration => TimeSpan.FromMinutes(5);
}

public record SkillSearchResultResponse(
    string SkillId,
    string UserId,
    string Name,
    string Description,
    bool IsOffered,
    SkillCategoryResponse Category,
    ProficiencyLevelResponse ProficiencyLevel,
    string TagsJson,
    double? AverageRating,
    int ReviewCount,
    int EndorsementCount,
    int? EstimatedDurationMinutes,
    DateTime CreatedAt,
    DateTime? LastActiveAt);

public class SearchSkillsQueryValidator : AbstractValidator<SearchSkillsQuery>
{
    public SearchSkillsQueryValidator()
    {
        RuleFor(x => x.SearchTerm)
            .MaximumLength(200).WithMessage("Search query must not exceed 200 characters")
            .When(x => !string.IsNullOrEmpty(x.SearchTerm));

        RuleFor(x => x.Tags)
            .Must(tags => tags == null || tags.Count <= 10)
            .WithMessage("Maximum 10 tags allowed in search");

        //RuleFor(x => x.M)
        //    .GreaterThan(0).WithMessage("Max distance must be greater than 0")
        //    .LessThanOrEqualTo(10000).WithMessage("Max distance cannot exceed 10000 km")
        //    .When(x => x.MaxDistance.HasValue);

        RuleFor(x => x.MinRating)
            .InclusiveBetween(1, 5).WithMessage("Min rating must be between 1 and 5")
            .When(x => x.MinRating.HasValue);

        RuleFor(x => x.SortBy)
            .Must(BeValidSortField).WithMessage($"Invalid sort field")
            .When(x => !string.IsNullOrEmpty(x.SortBy));

        RuleFor(x => x.PageNumber)
            .GreaterThan(0).WithMessage("Page number must be greater than 0");

        RuleFor(x => x.PageSize)
            .InclusiveBetween(1, 100).WithMessage("Page size must be between 1 and 100");
    }

    private static bool BeValidSortField(string? sortBy)
    {
        if (string.IsNullOrEmpty(sortBy)) return true;

        var validSortFields = new[] { "relevance", "name", "rating", "createdat", "updatedat", "popularity" };
        return validSortFields.Contains(sortBy.ToLowerInvariant());
    }
}
