using CQRS.Handlers;
using CQRS.Models;
// using Infrastructure.Services;
using MatchmakingService.Application.Queries;
using Microsoft.EntityFrameworkCore;

namespace MatchmakingService.Application.QueryHandlers;

public class GetMatchDetailsQueryHandler(
    MatchmakingDbContext dbContext,
    // IUserLookupService userLookup,
    ILogger<GetMatchDetailsQueryHandler> logger)
    : BaseQueryHandler<GetMatchDetailsQuery, MatchDetailsResponse>(logger)
{
    private readonly MatchmakingDbContext _dbContext = dbContext;
    // private readonly IUserLookupService _userLookup = userLookup;

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

            // var offeringUser = await _userLookup.GetUserAsync(match.OfferingUserId, cancellationToken);
            // var requestingUser = await _userLookup.GetUserAsync(match.RequestingUserId, cancellationToken);
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
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error getting match details for {MatchId}", request.MatchId);
            return Error("An error occurred while retrieving match details");
        }
    }
}
