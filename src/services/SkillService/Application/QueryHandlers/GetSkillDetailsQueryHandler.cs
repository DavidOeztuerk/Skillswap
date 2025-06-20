// ============================================================================
// SKILL SERVICE QUERY HANDLERS - COMPLETE IMPLEMENTATION
// src/services/SkillService/Application/QueryHandlers/
// ============================================================================

using Microsoft.EntityFrameworkCore;
using CQRS.Handlers;
using Infrastructure.Models;
using SkillService.Application.Queries;

namespace SkillService.Application.QueryHandlers;

// ============================================================================
// GET SKILL DETAILS QUERY HANDLER
// ============================================================================

public class GetSkillDetailsQueryHandler(
    SkillDbContext dbContext,
    ILogger<GetSkillDetailsQueryHandler> logger)
    : BaseQueryHandler<
    GetSkillDetailsQuery,
    SkillDetailsResponse>(
        logger)
{
    private readonly SkillDbContext _dbContext = dbContext;

    public override async Task<ApiResponse<SkillDetailsResponse>> Handle(
        GetSkillDetailsQuery request,
        CancellationToken cancellationToken)
    {
        try
        {
            var skill = await _dbContext.Skills
                .Include(s => s.SkillCategory)
                .Include(s => s.ProficiencyLevel)
                .Include(s => s.Reviews.Where(r => r.IsVisible && !r.IsDeleted))
                .Include(s => s.Endorsements.Where(e => e.IsVisible && !e.IsDeleted))
                .FirstOrDefaultAsync(s => s.Id == request.SkillId && !s.IsDeleted, cancellationToken);

            if (skill == null)
            {
                return NotFound("Skill not found");
            }

            var reviews = request.IncludeReviews && skill.Reviews.Any()
                ? skill.Reviews.Take(10).Select(r => new SkillReviewResponse(
                    r.Id,
                    r.ReviewerUserId,
                    "Reviewer Name", // TODO: Get from UserService
                    r.Rating,
                    r.Comment,
                    r.Tags,
                    r.CreatedAt)).ToList()
                : null;

            var endorsements = request.IncludeEndorsements && skill.Endorsements.Any()
                ? skill.Endorsements.Take(10).Select(e => new SkillEndorsementResponse(
                    e.Id,
                    e.EndorserUserId,
                    "Endorser Name", // TODO: Get from UserService
                    e.Message,
                    e.CreatedAt)).ToList()
                : null;

            var response = new SkillDetailsResponse(
                skill.Id,
                skill.UserId,
                "User Name", // TODO: Get from UserService
                "Profile Picture URL", // TODO: Get from UserService
                skill.Name,
                skill.Description,
                skill.IsOffering,
                new SkillCategoryResponse(
                    skill.SkillCategory.Id,
                    skill.SkillCategory.Name,
                    skill.SkillCategory.Description,
                    skill.SkillCategory.IconName,
                    skill.SkillCategory.Color,
                    skill.SkillCategory.SortOrder,
                    null,
                    skill.SkillCategory.IsActive,
                    skill.SkillCategory.CreatedAt),
                new ProficiencyLevelResponse(
                    skill.ProficiencyLevel.Id,
                    skill.ProficiencyLevel.Level,
                    skill.ProficiencyLevel.Description,
                    skill.ProficiencyLevel.Rank,
                    skill.ProficiencyLevel.Color,
                    null,
                    skill.ProficiencyLevel.IsActive,
                    skill.ProficiencyLevel.CreatedAt),
                skill.Tags,
                skill.Requirements,
                skill.Location,
                skill.IsRemoteAvailable,
                skill.EstimatedDurationMinutes,
                skill.AverageRating,
                skill.ReviewCount,
                skill.EndorsementCount,
                reviews,
                endorsements,
                skill.CreatedAt,
                skill.UpdatedAt ?? skill.CreatedAt,
                skill.LastViewedAt,
                skill.IsActive);

            return Success(response);
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error getting skill details for {SkillId}", request.SkillId);
            return Error("An error occurred while retrieving skill details");
        }
    }
}
