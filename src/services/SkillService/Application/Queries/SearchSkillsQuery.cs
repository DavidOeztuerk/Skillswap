using CQRS.Interfaces;
using FluentValidation;

namespace SkillService.Application.Queries;

public record SearchSkillsQuery(
    string? SearchTerm = null,
    string? CategoryId = null,
    List<string>? Tags = null,
    string? ProficiencyLevelId = null,
    bool? IsOffered = null,
    bool? IsWanted = null,
    string? Location = null,
    bool? IsRemote = null,
    decimal? MinRating = null,
    decimal? MaxRating = null,
    string? SortBy = "CreatedAt",
    bool SortDescending = true,
    int PageNumber = 1,
    int PageSize = 20)
    : IPagedQuery<SkillSearchResultResponse>,
    ICacheableQuery
{
    int IPagedQuery<SkillSearchResultResponse>.PageNumber { get; set; } = PageNumber;
    int IPagedQuery<SkillSearchResultResponse>.PageSize { get; set; } = PageSize;

    public string CacheKey => $"skills-search:{SearchTerm}:{CategoryId}:{ProficiencyLevelId}:{IsOffered}:{string.Join(",", Tags != null ? Tags : "")}:{PageNumber}:{PageSize}";
    public TimeSpan CacheDuration => TimeSpan.FromMinutes(5);
}

public record SkillSearchResultResponse(
    string SkillId,
    string UserId,
    string Name,
    string Description,
    bool IsOffering,
    SkillCategoryResponse Category,
    ProficiencyLevelResponse ProficiencyLevel,
    string TagsJson,
    double? AverageRating,
    int ReviewCount,
    int EndorsementCount,
    string? Location,
    bool IsRemoteAvailable,
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
            .Must(tags => tags == null)
            .WithMessage("Maximum 10 tags allowed in search");

        //RuleFor(x => x.M)
        //    .GreaterThan(0).WithMessage("Max distance must be greater than 0")
        //    .LessThanOrEqualTo(10000).WithMessage("Max distance cannot exceed 10000 km")
        //    .When(x => x.MaxDistance.HasValue);

        RuleFor(x => x.MinRating)
            .InclusiveBetween(1, 5).WithMessage("Min rating must be between 1 and 5")
            .When(x => x.MinRating.HasValue);

        RuleFor(x => x.SortBy)
            .Must(BeValidSortField).WithMessage("Invalid sort field")
            .When(x => !string.IsNullOrEmpty(x.SortBy));

        RuleFor(x => x.PageNumber)
            .GreaterThan(0).WithMessage("Page number must be greater than 0");

        RuleFor(x => x.PageSize)
            .InclusiveBetween(1, 100).WithMessage("Page size must be between 1 and 100");
    }

    private static bool BeValidSortField(string? sortBy)
    {
        if (string.IsNullOrEmpty(sortBy)) return true;

        var validSortFields = new[] { "relevance", "name", "rating", "created", "updated", "popularity" };
        return validSortFields.Contains(sortBy.ToLowerInvariant());
    }
}
