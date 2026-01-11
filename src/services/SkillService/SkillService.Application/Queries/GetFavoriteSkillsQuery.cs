using CQRS.Interfaces;
using FluentValidation;

namespace SkillService.Application.Queries;

/// <summary>
/// Query to get a user's favorite skills with pagination.
/// Returns the same SkillSearchResultResponse as the search query.
/// </summary>
public record GetFavoriteSkillsQuery(
    string UserId,
    int PageNumber = 1,
    int PageSize = 20)
    : IPagedQuery<SkillSearchResultResponse>, ICacheableQuery
{
    public int PageNumber { get; set; } = PageNumber;
    public int PageSize { get; set; } = PageSize;

    // ICacheableQuery implementation
    public string CacheKey => $"favorite-skills:{UserId}:{PageNumber}:{PageSize}";
    public TimeSpan CacheDuration => TimeSpan.FromMinutes(5);
}

public class GetFavoriteSkillsQueryValidator : AbstractValidator<GetFavoriteSkillsQuery>
{
    public GetFavoriteSkillsQueryValidator()
    {
        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("User ID is required");

        RuleFor(x => x.PageNumber)
            .GreaterThan(0).WithMessage("Page number must be greater than 0");

        RuleFor(x => x.PageSize)
            .InclusiveBetween(1, 50).WithMessage("Page size must be between 1 and 50");
    }
}
