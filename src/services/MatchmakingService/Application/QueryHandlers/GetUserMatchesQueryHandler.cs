using CQRS.Handlers;
using Infrastructure.Models;
using Infrastructure.Services;
using MatchmakingService.Application.Queries;
using MatchmakingService.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MatchmakingService.Application.QueryHandlers;

public class GetUserMatchesQueryHandler(
    MatchmakingDbContext dbContext,
    IUserLookupService userLookup,
    ILogger<GetUserMatchesQueryHandler> logger)
    : BasePagedQueryHandler<GetUserMatchesQuery, UserMatchResponse>(logger)
{
    private readonly MatchmakingDbContext _dbContext = dbContext;
    private readonly IUserLookupService _userLookup = userLookup;

    public override async Task<PagedResponse<UserMatchResponse>> Handle(
        GetUserMatchesQuery request,
        CancellationToken cancellationToken)
    {
        try
        {
            // Note: UserId would come from the HTTP context in the controller
            // For this implementation, we'll need to modify the query to include UserId
            var query = _dbContext.Matches
                .Where(m => !m.IsDeleted);

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
                var otherUser = await _userLookup.GetUserAsync(m.OfferingUserId, cancellationToken);
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
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error getting user matches");
            return Error("An error occurred while retrieving user matches");
        }
    }
}
