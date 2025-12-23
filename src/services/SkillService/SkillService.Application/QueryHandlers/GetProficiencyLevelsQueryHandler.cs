using CQRS.Handlers;
using SkillService.Application.Queries;
using CQRS.Models;
using Contracts.Skill.Responses;
using SkillService.Domain.Repositories;
using Microsoft.Extensions.Logging;

namespace SkillService.Application.QueryHandlers;

public class GetProficiencyLevelsQueryHandler(
    ISkillUnitOfWork unitOfWork,
    ILogger<GetProficiencyLevelsQueryHandler> logger)
    : BaseQueryHandler<
    GetProficiencyLevelsQuery,
    List<ProficiencyLevelResponse>>(
        logger)
{
    private readonly ISkillUnitOfWork _unitOfWork = unitOfWork;

    public override async Task<ApiResponse<List<ProficiencyLevelResponse>>> Handle(
        GetProficiencyLevelsQuery request,
        CancellationToken cancellationToken)
    {
        {
            var allLevels = await _unitOfWork.ProficiencyLevels.GetAllAsync(cancellationToken);

            var levels = allLevels
                .Where(p => request.IncludeInactive || p.IsActive)
                .OrderBy(p => p.Rank)
                .Select(p => new ProficiencyLevelResponse(
                    p.Id,
                    p.Level,
                    p.Rank,
                    p.Color,
                    0)) // Count wird in Infrastructure mit Join berechnet
                .ToList();

            return Success(levels);
        }
    }
}
