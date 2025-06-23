// ============================================================================
// SKILL SERVICE QUERY HANDLERS - COMPLETE IMPLEMENTATION
// src/services/SkillService/Application/QueryHandlers/
// ============================================================================

using Microsoft.EntityFrameworkCore;
using CQRS.Handlers;
using Infrastructure.Models;
using Contracts.Users;
using Infrastructure.Services;
using SkillService.Application.Queries;

namespace SkillService.Application.QueryHandlers;

// ============================================================================
// GET SKILL DETAILS QUERY HANDLER
// ============================================================================

public class GetSkillDetailsQueryHandler(
    SkillDbContext dbContext,
    IUserLookupService userLookup,
    ILogger<GetSkillDetailsQueryHandler> logger)
    : BaseQueryHandler<
    GetSkillDetailsQuery,
    SkillDetailsResponse>(
        logger)
{
    private readonly SkillDbContext _dbContext = dbContext;
    private readonly IUserLookupService _userLookup = userLookup;

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

            List<SkillReviewResponse>? reviews = null;
            if (request.IncludeReviews && skill.Reviews.Any())
            {
                reviews = new List<SkillReviewResponse>();
                foreach (var r in skill.Reviews.Take(10))
                {
                    var reviewer = await _userLookup.GetUserAsync(r.ReviewerUserId, cancellationToken);
                    reviews.Add(new SkillReviewResponse(
                        r.Id,
                        r.ReviewerUserId,
                        reviewer?.FullName ?? string.Empty,
                        r.Rating,
                        r.Comment,
                        r.Tags,
                        r.CreatedAt));
                }
            }

            List<SkillEndorsementResponse>? endorsements = null;
            if (request.IncludeEndorsements && skill.Endorsements.Any())
            {
                endorsements = new List<SkillEndorsementResponse>();
                foreach (var e in skill.Endorsements.Take(10))
                {
                    var endorser = await _userLookup.GetUserAsync(e.EndorserUserId, cancellationToken);
                    endorsements.Add(new SkillEndorsementResponse(
                        e.Id,
                        e.EndorserUserId,
                        endorser?.FullName ?? string.Empty,
                        e.Message,
                        e.CreatedAt));
                }
            }

            var owner = await _userLookup.GetUserAsync(skill.UserId, cancellationToken);

            var response = new SkillDetailsResponse(
                skill.Id,
                skill.UserId,
                owner?.FullName ?? string.Empty,
                owner?.ProfilePictureUrl ?? string.Empty,
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
