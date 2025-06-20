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
// GET PROFICIENCY LEVELS QUERY HANDLER
// ============================================================================

public class GetProficiencyLevelsQueryHandler(
    SkillDbContext dbContext,
    ILogger<GetProficiencyLevelsQueryHandler> logger) 
    : BaseQueryHandler<
    GetProficiencyLevelsQuery,
    List<ProficiencyLevelResponse>>(
        logger)
{
    private readonly SkillDbContext _dbContext = dbContext;

    public override async Task<ApiResponse<List<ProficiencyLevelResponse>>> Handle(
        GetProficiencyLevelsQuery request,
        CancellationToken cancellationToken)
    {
        try
        {
            var query = _dbContext.ProficiencyLevels.AsQueryable();

            if (!request.IncludeInactive)
            {
                query = query.Where(p => p.IsActive);
            }

            query = query.OrderBy(p => p.Rank);

            var levels = await query
                .Select(p => new ProficiencyLevelResponse(
                    p.Id,
                    p.Level,
                    p.Description,
                    p.Rank,
                    p.Color,
                    request.IncludeSkillCounts ? p.Skills.Count(s => s.IsActive && !s.IsDeleted) : null,
                    p.IsActive,
                    p.CreatedAt))
                .ToListAsync(cancellationToken);

            return Success(levels);
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error getting proficiency levels");
            return Error("An error occurred while retrieving proficiency levels");
        }
    }
}
