using CQRS.Interfaces;
using FluentValidation;

namespace SkillService.Application.Queries;

// ============================================================================
// VALIDATE SKILL NAME QUERY
// ============================================================================

public record ValidateSkillNameQuery(
    string Name,
    string? ExcludeSkillId = null)
    : IQuery<SkillNameValidationResponse>, ICacheableQuery
{
    public string CacheKey => $"validate-skill-name:{Name}:{ExcludeSkillId}";
    public TimeSpan CacheDuration => TimeSpan.FromMinutes(5);
}

public record SkillNameValidationResponse(
    bool IsAvailable,
    bool IsSimilarToExisting,
    List<string> SimilarSkillNames,
    List<string> Suggestions);

public class ValidateSkillNameQueryValidator : AbstractValidator<ValidateSkillNameQuery>
{
    public ValidateSkillNameQueryValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Skill name is required")
            .Length(3, 100).WithMessage("Skill name must be between 3 and 100 characters");
    }
}
