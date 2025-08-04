using CQRS.Interfaces;
using FluentValidation;
using Contracts.Skill.Responses;

namespace SkillService.Application.Queries;

// ============================================================================
// GET SKILL DETAILS QUERY
// ============================================================================

public record GetSkillDetailsQuery(
    string SkillId,
    bool IncludeReviews = false,
    bool IncludeEndorsements = false)
    : IQuery<SkillDetailsResponse>, ICacheableQuery
{
    public string CacheKey => $"skill-details:{SkillId}:{IncludeReviews}:{IncludeEndorsements}";
    public TimeSpan CacheDuration => TimeSpan.FromMinutes(10);
}

public class GetSkillDetailsQueryValidator : AbstractValidator<GetSkillDetailsQuery>
{
    public GetSkillDetailsQueryValidator()
    {
        RuleFor(x => x.SkillId)
            .NotEmpty().WithMessage("Skill ID is required");
    }
}
