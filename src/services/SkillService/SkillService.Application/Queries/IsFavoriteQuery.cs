using Contracts.Skill.Responses;
using CQRS.Interfaces;
using FluentValidation;

namespace SkillService.Application.Queries;

/// <summary>
/// Query to check if a skill is favorited by the current user.
/// </summary>
public record IsFavoriteQuery(string UserId, string SkillId)
    : IQuery<IsFavoriteResponse>, ICacheableQuery
{
    // ICacheableQuery implementation
    public string CacheKey => $"is-favorite:{UserId}:{SkillId}";
    public TimeSpan CacheDuration => TimeSpan.FromMinutes(10);
}

public class IsFavoriteQueryValidator : AbstractValidator<IsFavoriteQuery>
{
    public IsFavoriteQueryValidator()
    {
        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("User ID is required");

        RuleFor(x => x.SkillId)
            .NotEmpty().WithMessage("Skill ID is required");
    }
}
