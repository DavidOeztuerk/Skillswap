using CQRS.Interfaces;
using FluentValidation;
using Contracts.Skill.Responses;

namespace SkillService.Application.Queries;

public record GetSkillDetailsQuery(
    string SkillId)
    : IQuery<SkillDetailsResponse>, ICacheableQuery
{
    public string CacheKey => $"skill-details:{SkillId}";
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
