using CQRS.Handlers;
using CQRS.Models;
using MatchmakingService.Application.Queries;
using MatchmakingService.Domain.Entities;
using MatchmakingService.Domain.Services;
using MatchmakingService.Infrastructure.HttpClients;
using Microsoft.EntityFrameworkCore;

namespace MatchmakingService.Application.QueryHandlers;

public class GetUserMatchesQueryHandler(
    MatchmakingDbContext dbContext,
    IUserServiceClient userServiceClient,
    ISkillServiceClient skillServiceClient,
    ILogger<GetUserMatchesQueryHandler> logger)
    : BasePagedQueryHandler<GetUserMatchesQuery, UserMatchResponse>(logger)
{
    private readonly MatchmakingDbContext _dbContext = dbContext;
    private readonly IUserServiceClient _userServiceClient = userServiceClient;
    private readonly ISkillServiceClient _skillServiceClient = skillServiceClient;

    public override async Task<PagedResponse<UserMatchResponse>> Handle(
        GetUserMatchesQuery request,
        CancellationToken cancellationToken)
    {
        try
        {
            var query = _dbContext.Matches
                .AsNoTracking()
                .Include(m => m.AcceptedMatchRequest)
                .Where(m => !m.IsDeleted &&
                    (m.AcceptedMatchRequest.TargetUserId == request.UserId ||
                     m.AcceptedMatchRequest.RequesterId == request.UserId));

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

                var partnerName = await FetchUserNameAsync(partnerId, cancellationToken);
                var partnerRating = await FetchUserRatingAsync(partnerId, cancellationToken);
                var skillName = await FetchSkillNameAsync(matchRequest.SkillId, cancellationToken);
                var skillCategory = await FetchSkillCategoryAsync(matchRequest.SkillId, cancellationToken);
                var exchangeSkillName = matchRequest.ExchangeSkillId != null
                    ? await FetchSkillNameAsync(matchRequest.ExchangeSkillId, cancellationToken)
                    : null;

                var requesterRating = isOffering
                    ? partnerRating
                    : await FetchUserRatingAsync(request.UserId, cancellationToken);
                var targetRating = isOffering
                    ? await FetchUserRatingAsync(request.UserId, cancellationToken)
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
                    Status: match.Status,
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
                        TotalSessions: matchRequest.TotalSessions ?? 1,
                        NextSessionDate: match.NextSessionDate
                    ),
                    AdditionalNotes: matchRequest.AdditionalNotes
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

    private async Task<string> FetchUserNameAsync(string userId, CancellationToken cancellationToken)
    {
        try
        {
            return await _userServiceClient.GetUserNameAsync(userId, cancellationToken);
        }
        catch (Exception ex)
        {
            Logger.LogWarning(ex, "Failed to fetch user name for {UserId}", userId);
            return "Unknown User";
        }
    }

    private async Task<double> FetchUserRatingAsync(string userId, CancellationToken cancellationToken)
    {
        try
        {
            return await _userServiceClient.GetUserRatingAsync(userId, cancellationToken);
        }
        catch (Exception ex)
        {
            Logger.LogWarning(ex, "Failed to fetch user rating for {UserId}", userId);
            return 4.0;
        }
    }

    private async Task<string> FetchSkillNameAsync(string skillId, CancellationToken cancellationToken)
    {
        try
        {
            return await _skillServiceClient.GetSkillNameAsync(skillId, cancellationToken);
        }
        catch (Exception ex)
        {
            Logger.LogWarning(ex, "Failed to fetch skill name for {SkillId}", skillId);
            return "Unknown Skill";
        }
    }

    private async Task<string> FetchSkillCategoryAsync(string skillId, CancellationToken cancellationToken)
    {
        try
        {
            return await _skillServiceClient.GetSkillCategoryAsync(skillId, cancellationToken);
        }
        catch (Exception ex)
        {
            Logger.LogWarning(ex, "Failed to fetch skill category for {SkillId}", skillId);
            return "General";
        }
    }
}
