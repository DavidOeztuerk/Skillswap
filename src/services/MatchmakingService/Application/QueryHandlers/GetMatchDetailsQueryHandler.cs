using CQRS.Handlers;
using CQRS.Models;
using MatchmakingService.Application.Queries;
using Microsoft.EntityFrameworkCore;

namespace MatchmakingService.Application.QueryHandlers;

public class GetMatchDetailsQueryHandler(
    MatchmakingDbContext dbContext,
    ILogger<GetMatchDetailsQueryHandler> logger)
    : BaseQueryHandler<GetMatchDetailsQuery, MatchDetailsResponse>(logger)
{
    private readonly MatchmakingDbContext _dbContext = dbContext;

    public override async Task<ApiResponse<MatchDetailsResponse>> Handle(
        GetMatchDetailsQuery request,
        CancellationToken cancellationToken)
    {
        {
            var match = await _dbContext.Matches
                .FirstOrDefaultAsync(m => m.Id == request.MatchId && !m.IsDeleted, cancellationToken);

            if (match == null)
            {
                return NotFound("Match not found");
            }

            var response = new MatchDetailsResponse(
                match.Id,
                match.OfferedSkillId,
                match.OfferedSkillName,
                match.RequestedSkillId,
                match.RequestedSkillName,
                match.OfferingUserId,
                match.RequestingUserId,
                match.Status,
                match.CompatibilityScore,
                match.MatchReason,
                match.CreatedAt,
                match.AcceptedAt,
                match.CompletedAt,
                match.SessionDurationMinutes);

            return Success(response);
        }
    }
}
