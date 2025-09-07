using CQRS.Handlers;
using CQRS.Models;
using MatchmakingService.Application.Queries;
using MatchmakingService.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MatchmakingService.Application.QueryHandlers;

public class GetUserMatchesQueryHandler(
    MatchmakingDbContext dbContext,
    ILogger<GetUserMatchesQueryHandler> logger)
    : BasePagedQueryHandler<GetUserMatchesQuery, UserMatchResponse>(logger)
{
    private readonly MatchmakingDbContext _dbContext = dbContext;

    public override async Task<PagedResponse<UserMatchResponse>> Handle(
        GetUserMatchesQuery request,
        CancellationToken cancellationToken)
    {
        {
            var query = _dbContext.Matches
                .AsNoTracking()
                .Where(m => !m.IsDeleted && (m.OfferingUserId == request.UserId || m.RequestingUserId == request.UserId));

            if (!string.IsNullOrEmpty(request.Status))
            {
                query = query.Where(m => m.Status == request.Status);
            }

            if (!request.IncludeCompleted)
            {
                query = query.Where(m => m.Status != MatchStatus.Completed);
            }

            query = query.OrderByDescending(m => m.CreatedAt);

            var totalRecords = await query.CountAsync(cancellationToken);

            var matchEntities = await query
                .Skip((request.PageNumber - 1) * request.PageSize)
                .Take(request.PageSize)
                .ToListAsync(cancellationToken);

            var matches = new List<UserMatchResponse>();
            foreach (var m in matchEntities)
            {
                matches.Add(new UserMatchResponse(
                    m.Id,
                    m.OfferedSkillName + " ↔ " + m.RequestedSkillName,
                    m.Status,
                    m.CompatibilityScore,
                    true,
                    m.CreatedAt,
                    m.AcceptedAt));
            }

            return Success(matches, request.PageNumber, request.PageSize, totalRecords);
        }
    }
}
