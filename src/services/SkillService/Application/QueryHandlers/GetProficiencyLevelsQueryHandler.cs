using Microsoft.EntityFrameworkCore;
using CQRS.Handlers;
using SkillService.Application.Queries;
using CQRS.Models;
using Contracts.Skill.Responses;

namespace SkillService.Application.QueryHandlers;

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
                    p.Rank,
                    p.Color,
                    p.Skills.Count))
                .ToListAsync(cancellationToken);

            return Success(levels);
        }
    }
}
