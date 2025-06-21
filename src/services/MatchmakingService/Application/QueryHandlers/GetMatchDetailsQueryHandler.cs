using CQRS.Handlers;
using Infrastructure.Models;
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
        try
        {
            var match = await _dbContext.Matches
                .FirstOrDefaultAsync(m => m.Id == request.MatchId && !m.IsDeleted, cancellationToken);

            if (match == null)
            {
                return NotFound("Match not found");
            }

            // TODO: Get user names from UserService
            var response = new MatchDetailsResponse(
                match.Id,
                match.OfferedSkillId,
                match.OfferedSkillName,
                match.RequestedSkillId,
                match.RequestedSkillName,
                match.OfferingUserId,
                "Offering User", // TODO: Get from UserService
                match.RequestingUserId,
                "Requesting User", // TODO: Get from UserService
                match.Status,
                match.CompatibilityScore,
                match.MatchReason,
                match.CreatedAt,
                match.AcceptedAt,
                match.CompletedAt,
                match.SessionDurationMinutes);

            return Success(response);
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error getting match details for {MatchId}", request.MatchId);
            return Error("An error occurred while retrieving match details");
        }
    }
}
