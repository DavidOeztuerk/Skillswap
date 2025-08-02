using Microsoft.EntityFrameworkCore;
using CQRS.Handlers;
using Infrastructure.Models;
using SkillService.Application.Queries;

namespace SkillService.Application.QueryHandlers;

public class GetUserSkillsQueryHandler(
    SkillDbContext dbContext,
    ILogger<GetUserSkillsQueryHandler> logger)
    : BasePagedQueryHandler<
    GetUserSkillsQuery,
    UserSkillResponse>(
        logger)
{
    private readonly SkillDbContext _dbContext = dbContext;

    public override async Task<PagedResponse<UserSkillResponse>> Handle(
        GetUserSkillsQuery request,
        CancellationToken cancellationToken)
    {
        try
        {
            var query = _dbContext.Skills
                .Include(s => s.SkillCategory)
                .Include(s => s.ProficiencyLevel)
                .Where(s => s.UserId == request.UserId && !s.IsDeleted);

            if (!request.IncludeInactive)
            {
                query = query.Where(s => s.IsActive);
            }

            if (request.IsOffering.HasValue)
            {
                query = query.Where(s => s.IsOffering == request.IsOffering.Value);
            }

            if (!string.IsNullOrEmpty(request.CategoryId))
            {
                query = query.Where(s => s.SkillCategoryId == request.CategoryId);
            }

            query = query.OrderByDescending(s => s.CreatedAt);

            var totalRecords = await query.CountAsync(cancellationToken);

            var skills = await query
                .Skip((request.PageNumber - 1) * request.PageSize)
                .Take(request.PageSize)
                .Select(s => new UserSkillResponse(
                    s.Id,
                    s.Name,
                    s.Description,
                    s.IsOffering,
                    new SkillCategoryResponse(
                        s.SkillCategory.Id,
                        s.SkillCategory.Name,
                        s.SkillCategory.IconName,
                        s.SkillCategory.Color),
                    new ProficiencyLevelResponse(
                        s.ProficiencyLevel.Id,
                        s.ProficiencyLevel.Level,
                        s.ProficiencyLevel.Rank,
                        s.ProficiencyLevel.Color),
                    s.Tags,
                    s.AverageRating,
                    s.ReviewCount,
                    s.EndorsementCount,
                    s.CreatedAt,
                    s.UpdatedAt ?? s.CreatedAt,
                    s.IsActive))
                .ToListAsync(cancellationToken);

            return Success(skills, request.PageNumber, request.PageSize, totalRecords);
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error getting user skills for {UserId}", request.UserId);
            return Error("An error occurred while retrieving user skills");
        }
    }
}
