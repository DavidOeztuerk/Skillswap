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
    IUserServiceClient userServiceClient,
    ILogger<GetMatchDetailsQueryHandler> logger)
    : BaseQueryHandler<GetMatchDetailsQuery, MatchDetailsResponse>(logger)
{
    private readonly IMatchmakingUnitOfWork _unitOfWork = unitOfWork;
    private readonly ISkillServiceClient _skillServiceClient = skillServiceClient;
    private readonly IUserServiceClient _userServiceClient = userServiceClient;

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
        var requestingUserId = request.RequestingUserId;

        // Determine partner based on requesting user
        var isOffering = matchRequest.TargetUserId == requestingUserId;
        var partnerId = isOffering ? matchRequest.RequesterId : matchRequest.TargetUserId;

        // Collect skill IDs to fetch
        var skillIds = new List<string> { matchRequest.SkillId };
        if (matchRequest.ExchangeSkillId != null)
        {
            skillIds.Add(matchRequest.ExchangeSkillId);
        }

        // Fetch skill data and partner profile in parallel
        var skillDetailsTask = _skillServiceClient.GetSkillDetailsBatchAsync(skillIds, cancellationToken);
        var userProfilesTask = _userServiceClient.GetUserProfilesBatchAsync([partnerId], cancellationToken);

        await Task.WhenAll(skillDetailsTask, userProfilesTask);

        var skillDetails = await skillDetailsTask;
        var userProfiles = await userProfilesTask;
        var partnerProfile = userProfiles.GetValueOrDefault(partnerId);

        var mainSkill = skillDetails.GetValueOrDefault(matchRequest.SkillId);
        var skillName = mainSkill?.Name ?? "Unknown Skill";
        var skillCategory = mainSkill?.CategoryName ?? "General";

        string? exchangeSkillName = null;
        if (matchRequest.ExchangeSkillId != null)
        {
            var exchangeSkill = skillDetails.GetValueOrDefault(matchRequest.ExchangeSkillId);
            exchangeSkillName = exchangeSkill?.Name;
        }

        var response = new MatchDetailsResponse(
            MatchId: match.Id,
            SkillId: matchRequest.SkillId,
            SkillName: skillName,
            SkillCategory: skillCategory,
            Status: match.Status.ToString(),

            // Partner info
            PartnerId: partnerId,
            PartnerName: partnerProfile?.UserName ?? "Unknown User",
            PartnerRating: partnerProfile?.AverageRating ?? 4.0,
            PartnerAvatar: null, // UserProfileBatch doesn't include avatar URL

            // Original participants
            OfferingUserId: matchRequest.TargetUserId,
            RequestingUserId: matchRequest.RequesterId,

            // Match details
            IsOffering: isOffering,
            CompatibilityScore: matchRequest.CompatibilityScore,

            // Exchange info
            IsSkillExchange: matchRequest.IsSkillExchange,
            ExchangeSkillId: matchRequest.ExchangeSkillId,
            ExchangeSkillName: exchangeSkillName,

            // Monetary info
            IsMonetary: matchRequest.IsMonetaryOffer,
            OfferedAmount: matchRequest.OfferedAmount,
            Currency: matchRequest.Currency,

            // Session info
            SessionInfo: new MatchSessionInfo(
                CompletedSessions: match.CompletedSessions,
                TotalSessions: matchRequest.TotalSessions,
                NextSessionDate: match.NextSessionDate
            ),

            // Preferences
            IsLearningMode: !isOffering,
            PreferredDays: matchRequest.PreferredDays?.ToArray(),
            PreferredTimes: matchRequest.PreferredTimes?.ToArray(),
            AdditionalNotes: matchRequest.AdditionalNotes,

            // Timestamps
            CreatedAt: match.CreatedAt,
            AcceptedAt: match.AcceptedAt,
            CompletedAt: match.CompletedAt);

        return Success(response);
    }
}
