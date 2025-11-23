using CQRS.Interfaces;
using FluentValidation;
using Contracts.Skill.Responses;

namespace SkillService.Application.Queries;

public record GetSkillRecommendationsQuery(
    string UserId,
    int MaxRecommendations = 10)
    : IQuery<List<SkillRecommendationResponse>>, ICacheableQuery
{
    public string CacheKey => $"skill-recommendations:{UserId}:{MaxRecommendations}";
    public TimeSpan CacheDuration => TimeSpan.FromMinutes(10); // Reduced from 30 to 10 minutes
}

public class GetSkillRecommendationsQueryValidator : AbstractValidator<GetSkillRecommendationsQuery>
{
    public GetSkillRecommendationsQueryValidator()
    {
        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("User ID is required");

        RuleFor(x => x.MaxRecommendations)
            .InclusiveBetween(1, 50).WithMessage("Max recommendations must be between 1 and 50");
    }
}
