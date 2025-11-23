using CQRS.Handlers;
using Microsoft.EntityFrameworkCore;
using CQRS.Models;
using MatchmakingService.Application.Queries;
using Microsoft.Extensions.Logging;
using MatchmakingService.Domain.Services;
using MatchmakingService.Domain.Repositories;

namespace MatchmakingService.Application.QueryHandlers;

public class GetMatchDetailsQueryHandler(
    IMatchmakingUnitOfWork unitOfWork,
    ISkillServiceClient skillServiceClient,
    ILogger<GetMatchDetailsQueryHandler> logger)
    : BaseQueryHandler<GetMatchDetailsQuery, MatchDetailsResponse>(logger)
{
    private readonly IMatchmakingUnitOfWork _unitOfWork = unitOfWork;
    private readonly ISkillServiceClient _skillServiceClient = skillServiceClient;

    public override async Task<ApiResponse<MatchDetailsResponse>> Handle(
        GetMatchDetailsQuery request,
        CancellationToken cancellationToken)
    {
        var match = await _unitOfWork.Matches.Query
            .Include(m => m.AcceptedMatchRequest)
            .FirstOrDefaultAsync(m => m.Id == request.MatchId && !m.IsDeleted, cancellationToken);

        if (match == null)
        {
            return NotFound("Match not found");
        }

        var matchRequest = match.AcceptedMatchRequest;

        var skillName = await _skillServiceClient.GetSkillNameAsync(matchRequest.SkillId, cancellationToken);
        var skillCategory = await _skillServiceClient.GetSkillCategoryAsync(matchRequest.SkillId, cancellationToken);
        var exchangeSkillName = matchRequest.ExchangeSkillId != null
            ? await _skillServiceClient.GetSkillNameAsync(matchRequest.ExchangeSkillId, cancellationToken)
            : null;

        var response = new MatchDetailsResponse(
            match.Id,
            matchRequest.SkillId,
            skillName,
            skillCategory,
            matchRequest.TargetUserId,
            matchRequest.RequesterId,
            match.Status,
            matchRequest.CompatibilityScore,
            matchRequest.IsSkillExchange,
            matchRequest.ExchangeSkillId,
            exchangeSkillName,
            matchRequest.IsMonetaryOffer,
            matchRequest.OfferedAmount,
            matchRequest.Currency,
            match.CreatedAt,
            match.AcceptedAt,
            match.CompletedAt,
            match.CompletedSessions,
            matchRequest.TotalSessions ?? 1,
            matchRequest.SessionDurationMinutes,
            matchRequest.PreferredDays?.ToArray(),
            matchRequest.PreferredTimes?.ToArray());

        return Success(response);
    }
}
