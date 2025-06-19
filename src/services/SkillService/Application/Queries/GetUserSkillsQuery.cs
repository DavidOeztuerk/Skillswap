using CQRS.Interfaces;
using FluentValidation;

namespace SkillService.Application.Queries;

// ============================================================================
// GET USER SKILLS QUERY
// ============================================================================

public record GetUserSkillsQuery(
    string UserId,
    bool? IsOffering = null,
    string? CategoryId = null,
    bool IncludeInactive = false,
    int PageNumber = 1,
    int PageSize = 20)
    : IPagedQuery<UserSkillResponse>, ICacheableQuery
{
    int IPagedQuery<UserSkillResponse>.PageNumber { get; set; } = PageNumber;
    int IPagedQuery<UserSkillResponse>.PageSize { get; set; } = PageSize;

    public string CacheKey => $"user-skills:{UserId}:{IsOffering}:{CategoryId}:{IncludeInactive}:{PageNumber}:{PageSize}";
    public TimeSpan CacheDuration => TimeSpan.FromMinutes(5);
}

public record UserSkillResponse(
    string SkillId,
    string Name,
    string Description,
    bool IsOffering,
    SkillCategoryResponse Category,
    ProficiencyLevelResponse ProficiencyLevel,
    List<string> Tags,
    double? AverageRating,
    int ReviewCount,
    int EndorsementCount,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    bool IsActive);

public class GetUserSkillsQueryValidator : AbstractValidator<GetUserSkillsQuery>
{
    public GetUserSkillsQueryValidator()
    {
        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("User ID is required");

        RuleFor(x => x.PageNumber)
            .GreaterThan(0).WithMessage("Page number must be greater than 0");

        RuleFor(x => x.PageSize)
            .InclusiveBetween(1, 50).WithMessage("Page size must be between 1 and 50");
    }
}
