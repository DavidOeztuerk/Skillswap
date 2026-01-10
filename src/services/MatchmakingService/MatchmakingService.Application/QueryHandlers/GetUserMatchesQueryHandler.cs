using CQRS.Handlers;
using CQRS.Models;
using MatchmakingService.Application.Queries;
using MatchmakingService.Domain.Entities;
using MatchmakingService.Domain.Enums;
using MatchmakingService.Domain.Repositories;
using MatchmakingService.Domain.Services;
using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;

namespace MatchmakingService.Application.QueryHandlers;

public class GetUserMatchesQueryHandler(
    IMatchmakingUnitOfWork unitOfWork,
    IUserServiceClient userServiceClient,
    ISkillServiceClient skillServiceClient,
    ILogger<GetUserMatchesQueryHandler> logger)
    : BasePagedQueryHandler<GetUserMatchesQuery, UserMatchResponse>(logger)
{
    private readonly IMatchmakingUnitOfWork _unitOfWork = unitOfWork;
    private readonly IUserServiceClient _userServiceClient = userServiceClient;
    private readonly ISkillServiceClient _skillServiceClient = skillServiceClient;

    public override async Task<PagedResponse<UserMatchResponse>> Handle(
        GetUserMatchesQuery request,
        CancellationToken cancellationToken)
    {
        try
        {
            var query = _unitOfWork.Matches.Query
                .AsNoTracking()
                .Include(m => m.AcceptedMatchRequest)
                .Where(m => !m.IsDeleted &&
                    (m.AcceptedMatchRequest.TargetUserId == request.UserId ||
                     m.AcceptedMatchRequest.RequesterId == request.UserId));

            if (!string.IsNullOrEmpty(request.Status))
            {
                if (Enum.TryParse<MatchStatus>(request.Status, ignoreCase: true, out var statusEnum))
                {
                    query = query.Where(m => m.Status == statusEnum);
                }
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

            // PERFORMANCE FIX: Batch fetch all user and skill data upfront
            var allUserIds = matchEntities
                .Where(m => m.AcceptedMatchRequest != null)
                .SelectMany(m => new[] { m.AcceptedMatchRequest!.RequesterId, m.AcceptedMatchRequest.TargetUserId, request.UserId })
                .Distinct()
                .ToList();

            var allSkillIds = matchEntities
                .Where(m => m.AcceptedMatchRequest != null)
                .SelectMany(m => new[] { m.AcceptedMatchRequest!.SkillId }
                    .Concat(m.AcceptedMatchRequest.ExchangeSkillId != null
                        ? new[] { m.AcceptedMatchRequest.ExchangeSkillId }
                        : Array.Empty<string>()))
                .Distinct()
                .ToList();

            Logger.LogInformation("Batch fetching {UserCount} users and {SkillCount} skills for {MatchCount} matches",
                allUserIds.Count, allSkillIds.Count, matchEntities.Count);

            // Batch fetch all data concurrently
            var userProfilesTask = _userServiceClient.GetUserProfilesBatchAsync(allUserIds, cancellationToken);
            var skillDetailsTask = _skillServiceClient.GetSkillDetailsBatchAsync(allSkillIds, cancellationToken);

            await Task.WhenAll(userProfilesTask, skillDetailsTask);

            var userProfiles = await userProfilesTask;
            var skillDetails = await skillDetailsTask;

            Logger.LogInformation("Batch fetch complete: {UserCount} users, {SkillCount} skills",
                userProfiles.Count, skillDetails.Count);

            // Build match responses using cached data
            var matches = new List<UserMatchResponse>();

            foreach (var match in matchEntities)
            {
                var matchRequest = match.AcceptedMatchRequest;
                if (matchRequest == null)
                {
                    Logger.LogWarning("Match {MatchId} has no AcceptedMatchRequest", match.Id);
                    continue;
                }

                var isOffering = matchRequest.TargetUserId == request.UserId;
                var partnerId = isOffering ? matchRequest.RequesterId : matchRequest.TargetUserId;

                // Lookup from batch-fetched data
                var partnerProfile = userProfiles.GetValueOrDefault(partnerId);
                var partnerName = partnerProfile?.UserName ?? "Unknown User";
                var partnerRating = partnerProfile?.AverageRating ?? 4.0;

                var skillDetail = skillDetails.GetValueOrDefault(matchRequest.SkillId);
                var skillName = skillDetail?.Name ?? "Unknown Skill";
                var skillCategory = skillDetail?.CategoryName ?? "General";

                string? exchangeSkillName = null;
                if (matchRequest.ExchangeSkillId != null)
                {
                    var exchangeSkillDetail = skillDetails.GetValueOrDefault(matchRequest.ExchangeSkillId);
                    exchangeSkillName = exchangeSkillDetail?.Name ?? "Unknown Skill";
                }

                var requesterProfile = userProfiles.GetValueOrDefault(matchRequest.RequesterId);
                var targetProfile = userProfiles.GetValueOrDefault(matchRequest.TargetUserId);

                var requesterRating = isOffering
                    ? partnerRating
                    : (requesterProfile?.AverageRating ?? 4.0);
                var targetRating = isOffering
                    ? (targetProfile?.AverageRating ?? 4.0)
                    : partnerRating;

                var compatibilityScore = CompatibilityCalculator.CalculateScore(
                    skillsMatch: true,
                    requesterRating: requesterRating,
                    targetUserRating: targetRating,
                    requesterPreferredDays: matchRequest.PreferredDays ?? new List<string>(),
                    targetUserPreferredDays: new List<string>(),
                    requesterPreferredTimes: matchRequest.PreferredTimes ?? new List<string>(),
                    targetUserPreferredTimes: new List<string>(),
                    isSkillExchange: matchRequest.IsSkillExchange,
                    exchangeSkillsMatch: matchRequest.ExchangeSkillId != null
                );

                var matchResponse = new UserMatchResponse(
                    Id: match.Id,
                    SkillId: matchRequest.SkillId,
                    SkillName: skillName,
                    SkillCategory: skillCategory,
                    Status: match.Status.ToString(),
                    PartnerId: partnerId,
                    PartnerName: partnerName,
                    PartnerRating: partnerRating,
                    PartnerAvatar: null,
                    RequesterId: matchRequest.RequesterId,
                    ResponderId: matchRequest.TargetUserId,
                    IsSkillExchange: matchRequest.IsSkillExchange,
                    ExchangeSkillId: matchRequest.ExchangeSkillId,
                    ExchangeSkillName: exchangeSkillName,
                    IsMonetary: matchRequest.IsMonetaryOffer,
                    OfferedAmount: matchRequest.OfferedAmount,
                    Currency: matchRequest.Currency,
                    IsOffering: isOffering,
                    CompatibilityScore: compatibilityScore,
                    CreatedAt: match.CreatedAt,
                    AcceptedAt: match.AcceptedAt,
                    CompletedAt: match.CompletedAt,
                    IsLearningMode: !isOffering,
                    PreferredDays: matchRequest.PreferredDays?.ToArray() ?? Array.Empty<string>(),
                    PreferredTimes: matchRequest.PreferredTimes?.ToArray() ?? Array.Empty<string>(),
                    SessionInfo: new SessionInfoResponse(
                        CompletedSessions: match.CompletedSessions,
                        TotalSessions: matchRequest.TotalSessions,
                        NextSessionDate: match.NextSessionDate
                    ),
                    AdditionalNotes: matchRequest.AdditionalNotes,
                    // Chat/Thread info from MatchRequest
                    ThreadId: matchRequest.ThreadId,
                    MatchRequestId: matchRequest.Id
                );

                matches.Add(matchResponse);
            }

            Logger.LogInformation("Retrieved {Count} matches for user {UserId}", matches.Count, request.UserId);

            return Success(matches, request.PageNumber, request.PageSize, totalRecords);
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error retrieving matches for user {UserId}", request.UserId);
            throw;
        }
    }
}
