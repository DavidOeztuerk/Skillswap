using CQRS.Interfaces;
using FluentValidation;

namespace SkillService.Application.Queries;

// ============================================================================
// GET SKILL LEARNING PATH QUERY
// ============================================================================

public record GetSkillLearningPathQuery(
    string TargetSkillId,
    string? CurrentSkillLevel = null,
    int MaxSteps = 10) 
    : IQuery<SkillLearningPathResponse>, ICacheableQuery
{
    public string CacheKey => $"learning-path:{TargetSkillId}:{CurrentSkillLevel}:{MaxSteps}";
    public TimeSpan CacheDuration => TimeSpan.FromMinutes(30);
}

public record SkillLearningPathResponse(
    string TargetSkillId,
    string TargetSkillName,
    List<LearningStepResponse> Steps,
    int EstimatedTotalHours,
    string DifficultyLevel);

public record LearningStepResponse(
    int StepNumber,
    string SkillId,
    string SkillName,
    string Description,
    string RequiredProficiencyLevel,
    int EstimatedHours,
    List<string> Prerequisites,
    List<LearningResourceResponse> Resources);

public record LearningResourceResponse(
    string ResourceId,
    string Title,
    string Type, // Course, Tutorial, Book, etc.
    string? Url,
    double? Rating,
    int? Duration,
    bool IsFree);

public class GetSkillLearningPathQueryValidator : AbstractValidator<GetSkillLearningPathQuery>
{
    public GetSkillLearningPathQueryValidator()
    {
        RuleFor(x => x.TargetSkillId)
            .NotEmpty().WithMessage("Target skill ID is required");

        RuleFor(x => x.MaxSteps)
            .InclusiveBetween(1, 20).WithMessage("Max steps must be between 1 and 20");
    }
}
