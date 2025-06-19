using CQRS.Interfaces;
using FluentValidation;

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

public record SkillDetailsResponse(
    string SkillId,
    string UserId,
    string UserName,
    string UserProfilePicture,
    string Name,
    string Description,
    bool IsOffering,
    SkillCategoryResponse Category,
    ProficiencyLevelResponse ProficiencyLevel,
    List<string> Tags,
    string? Requirements,
    string? Location,
    bool IsRemoteAvailable,
    int? EstimatedDurationMinutes,
    double? AverageRating,
    int ReviewCount,
    int EndorsementCount,
    List<SkillReviewResponse>? Reviews,
    List<SkillEndorsementResponse>? Endorsements,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    DateTime? LastActiveAt,
    bool IsActive);

public record SkillReviewResponse(
    string ReviewId,
    string ReviewerUserId,
    string ReviewerName,
    int Rating,
    string? Comment,
    List<string> Tags,
    DateTime CreatedAt);

public record SkillEndorsementResponse(
    string EndorsementId,
    string EndorserUserId,
    string EndorserName,
    string? Message,
    DateTime CreatedAt);

public class GetSkillDetailsQueryValidator : AbstractValidator<GetSkillDetailsQuery>
{
    public GetSkillDetailsQueryValidator()
    {
        RuleFor(x => x.SkillId)
            .NotEmpty().WithMessage("Skill ID is required");
    }
}
