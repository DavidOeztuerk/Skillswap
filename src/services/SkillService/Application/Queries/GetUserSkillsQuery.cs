using CQRS.Interfaces;
using FluentValidation;
using Contracts.Skill.Responses;

namespace SkillService.Application.Queries;

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
