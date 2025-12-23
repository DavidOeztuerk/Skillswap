using CQRS.Handlers;
using Microsoft.EntityFrameworkCore;
using CQRS.Models;
using MatchmakingService.Application.Queries;
using MatchmakingService.Domain.Entities;
using MatchmakingService.Domain.Repositories;
using MatchmakingService.Domain.Services;
using Microsoft.Extensions.Logging;

namespace MatchmakingService.Application.QueryHandlers;

public class GetMatchStatisticsQueryHandler(
    IMatchmakingUnitOfWork unitOfWork,
    ILogger<GetMatchStatisticsQueryHandler> logger)
    : BaseQueryHandler<GetMatchStatisticsQuery, MatchStatisticsResponse>(logger)
{
    private readonly IMatchmakingUnitOfWork _unitOfWork = unitOfWork;

    public override async Task<ApiResponse<MatchStatisticsResponse>> Handle(
        GetMatchStatisticsQuery request,
        CancellationToken cancellationToken)
    {
        var query = _unitOfWork.Matches.Query
            .Include(m => m.AcceptedMatchRequest)
            .Where(m => !m.IsDeleted);

        if (request.FromDate.HasValue)
        {
            query = query.Where(m => m.CreatedAt >= request.FromDate.Value);
        }

        if (request.ToDate.HasValue)
        {
            query = query.Where(m => m.CreatedAt <= request.ToDate.Value);
        }

        var totalMatches = await query.CountAsync(cancellationToken);
        var acceptedMatches = await query.CountAsync(m => m.Status == MatchStatus.Accepted, cancellationToken);
        var completedMatches = await query.CountAsync(m => m.Status == MatchStatus.Completed, cancellationToken);
        var dissolvedMatches = await query.CountAsync(m => m.Status == MatchStatus.Dissolved, cancellationToken);

        var successRate = totalMatches > 0
            ? Math.Round((double)completedMatches / totalMatches * 100, 2)
            : 0;

        var averageCompatibilityScore = await query
            .Where(m => m.AcceptedMatchRequest.CompatibilityScore.HasValue)
            .AverageAsync(m => m.AcceptedMatchRequest.CompatibilityScore!.Value, cancellationToken);

        var matchesBySkill = await query
            .GroupBy(m => m.AcceptedMatchRequest.SkillId)
            .Select(g => new { Skill = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.Skill, x => x.Count, cancellationToken);

        var topMatchedSkills = await query
            .Where(m => m.Status == MatchStatus.Completed)
            .GroupBy(m => m.AcceptedMatchRequest.SkillId)
            .Select(g => new TopSkillMatchResponse(
                g.Key,
                g.Count(),
                Math.Round(g.Where(m => m.AcceptedMatchRequest.CompatibilityScore.HasValue)
                    .Average(m => m.AcceptedMatchRequest.CompatibilityScore!.Value), 2)))
            .OrderByDescending(x => x.MatchCount)
            .Take(10)
            .ToListAsync(cancellationToken);

        var response = new MatchStatisticsResponse(
            totalMatches,
            0,
            acceptedMatches,
            completedMatches,
            dissolvedMatches,
            successRate,
            Math.Round(averageCompatibilityScore, 2),
            matchesBySkill,
            topMatchedSkills);

        return Success(response);
    }
}
