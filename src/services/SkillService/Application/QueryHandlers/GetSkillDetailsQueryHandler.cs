using Microsoft.EntityFrameworkCore;
using CQRS.Handlers;
using SkillService.Application.Queries;
using CQRS.Models;
using Contracts.Skill.Responses;
using SkillService.Infrastructure.HttpClients;

namespace SkillService.Application.QueryHandlers;

public class GetSkillDetailsQueryHandler(
    SkillDbContext dbContext,
    IUserServiceClient userServiceClient,
    ILogger<GetSkillDetailsQueryHandler> logger)
    : BaseQueryHandler<
    GetSkillDetailsQuery,
    SkillDetailsResponse>(
        logger)
{
    private readonly SkillDbContext _dbContext = dbContext;
    private readonly IUserServiceClient _userServiceClient = userServiceClient;

    public override async Task<ApiResponse<SkillDetailsResponse>> Handle(
        GetSkillDetailsQuery request,
        CancellationToken cancellationToken)
    {
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

            // Fetch owner details
            var ownerProfile = await _userServiceClient.GetUserProfileAsync(skill.UserId, cancellationToken);

            var response = new SkillDetailsResponse(
                skill.Id,
                skill.UserId,
                ownerProfile?.UserName,
                ownerProfile?.FirstName,
                ownerProfile?.LastName,
                ownerProfile?.AverageRating,
                ownerProfile?.MemberSince,
                skill.Name,
                skill.Description,
                new SkillCategoryResponse(
                    skill.SkillCategory.Id,
                    skill.SkillCategory.Name,
                    skill.SkillCategory.IconName,
                    skill.SkillCategory.Color,
                    skill.SkillCategory.Skills.Count),
                new ProficiencyLevelResponse(
                    skill.ProficiencyLevel.Id,
                    skill.ProficiencyLevel.Level,
                    skill.ProficiencyLevel.Rank,
                    skill.ProficiencyLevel.Color,
                    skill.ProficiencyLevel.Skills.Count),
                skill.Tags,
                skill.IsOffered,
                skill.AverageRating != null ? (decimal)skill.AverageRating : null,
                skill.Reviews.Select(x => new SkillReviewResponse(
                    x.Id,
                    x.ReviewerUserId,
                    x.Rating,
                    x.Comment,
                    x.Tags,
                    x.CreatedAt
                )).ToList(),
                skill.Endorsements.Select(x => new SkillEndorsementResponse(
                    x.Id,
                    x.EndorserUserId,
                    x.Message,
                    x.CreatedAt
                )).ToList(),
                null, // AvailableHours - not stored in skill entity
                skill.EstimatedDurationMinutes,
                skill.IsActive ? "Active" : "Inactive",
                skill.CreatedAt,
                skill.UpdatedAt ?? skill.CreatedAt);

            return Success(response);
        }
    }
}
