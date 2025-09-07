using CQRS.Handlers;
using CQRS.Models;
using MatchmakingService.Application.Queries;
using MatchmakingService.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MatchmakingService.Application.QueryHandlers;

public class GetMatchStatisticsQueryHandler(
    MatchmakingDbContext dbContext,
    ILogger<GetMatchStatisticsQueryHandler> logger)
    : BaseQueryHandler<GetMatchStatisticsQuery, MatchStatisticsResponse>(logger)
{
    private readonly MatchmakingDbContext _dbContext = dbContext;

    public override async Task<ApiResponse<MatchStatisticsResponse>> Handle(
        GetMatchStatisticsQuery request,
        CancellationToken cancellationToken)
    {
        {
            var query = _dbContext.Matches.Where(m => !m.IsDeleted);

            if (request.FromDate.HasValue)
            {
                query = query.Where(m => m.CreatedAt >= request.FromDate.Value);
            }

            if (request.ToDate.HasValue)
            {
                query = query.Where(m => m.CreatedAt <= request.ToDate.Value);
            }

            var totalMatches = await query.CountAsync(cancellationToken);
            var pendingMatches = await query.CountAsync(m => m.Status == MatchStatus.Pending, cancellationToken);
            var acceptedMatches = await query.CountAsync(m => m.Status == MatchStatus.Accepted, cancellationToken);
            var completedMatches = await query.CountAsync(m => m.Status == MatchStatus.Completed, cancellationToken);
            var rejectedMatches = await query.CountAsync(m => m.Status == MatchStatus.Rejected, cancellationToken);

            var successRate = totalMatches > 0
                ? Math.Round((double)completedMatches / totalMatches * 100, 2)
                : 0;

            var averageCompatibilityScore = await query
                .AverageAsync(m => m.CompatibilityScore, cancellationToken);

            var matchesBySkill = await query
                .GroupBy(m => m.OfferedSkillName)
                .Select(g => new { Skill = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.Skill, x => x.Count, cancellationToken);

            var topMatchedSkills = await query
                .Where(m => m.Status == MatchStatus.Completed)
                .GroupBy(m => m.OfferedSkillName)
                .Select(g => new TopSkillMatchResponse(
                    g.Key,
                    g.Count(),
                    Math.Round(g.Average(m => m.CompatibilityScore), 2)))
                .OrderByDescending(x => x.MatchCount)
                .Take(10)
                .ToListAsync(cancellationToken);

            var response = new MatchStatisticsResponse(
                totalMatches,
                pendingMatches,
                acceptedMatches,
                completedMatches,
                rejectedMatches,
                successRate,
                Math.Round(averageCompatibilityScore, 2),
                matchesBySkill,
                topMatchedSkills);

            return Success(response);
        }
    }
}
