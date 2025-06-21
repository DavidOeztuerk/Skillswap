using CQRS.Handlers;
using Infrastructure.Models;
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

            var matches = await query
                .Skip((request.PageNumber - 1) * request.PageSize)
                .Take(request.PageSize)
                .Select(m => new UserMatchResponse(
                    m.Id,
                    m.OfferedSkillName + " ↔ " + m.RequestedSkillName,
                    "Other User", // TODO: Get from UserService
                    m.Status,
                    m.CompatibilityScore,
                    true, // TODO: Determine if current user is offering
                    m.CreatedAt,
                    m.AcceptedAt))
                .ToListAsync(cancellationToken);

            return Success(matches, request.PageNumber, request.PageSize, totalRecords);
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error getting user matches");
            return Error("An error occurred while retrieving user matches");
        }
    }
}
