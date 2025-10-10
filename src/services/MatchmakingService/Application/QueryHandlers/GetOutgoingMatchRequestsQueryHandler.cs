using Contracts.Matchmaking.Responses;
using CQRS.Handlers;
using CQRS.Models;
using MatchmakingService.Application.Queries;
using MatchmakingService.Infrastructure.HttpClients;
using Microsoft.EntityFrameworkCore;

namespace MatchmakingService.Application.QueryHandlers;

public class GetOutgoingMatchRequestsQueryHandler(
    MatchmakingDbContext dbContext,
    IUserServiceClient userServiceClient,
    ISkillServiceClient skillServiceClient,
    ILogger<GetOutgoingMatchRequestsQueryHandler> logger)
    : BasePagedQueryHandler<GetOutgoingMatchRequestsQuery, MatchRequestDisplayResponse>(logger)
{
    private readonly MatchmakingDbContext _dbContext = dbContext;
    private readonly IUserServiceClient _userServiceClient = userServiceClient;
    private readonly ISkillServiceClient _skillServiceClient = skillServiceClient;

    public override async Task<PagedResponse<MatchRequestDisplayResponse>> Handle(
        GetOutgoingMatchRequestsQuery request,
        CancellationToken cancellationToken)
    {
        {
            if (string.IsNullOrEmpty(request.UserId))
            {
                return Success(new List<MatchRequestDisplayResponse>(), request.PageNumber, request.PageSize, 0);
            }

            // Query outgoing requests where current user is the requester
            var query = _dbContext.MatchRequests
                .Where(mr => mr.RequesterId == request.UserId && mr.Status.ToLower() == "pending")
                .OrderByDescending(mr => mr.CreatedAt);

            var totalCount = await query.CountAsync(cancellationToken);

            var matchRequests = await query
                .Skip((request.PageNumber - 1) * request.PageSize)
                .Take(request.PageSize)
                .ToListAsync(cancellationToken);

            var displayResponses = new List<MatchRequestDisplayResponse>();

            foreach (var mr in matchRequests)
            {
                // Get skill data
                var skillData = await GetSkillData(mr.SkillId, cancellationToken);

                // Get target user data (the one receiving the request)
                var targetUserData = await GetUserData(mr.TargetUserId, cancellationToken);

                // Get exchange skill data if needed
                string? exchangeSkillName = null;
                if (!string.IsNullOrEmpty(mr.ExchangeSkillId))
                {
                    var exchangeSkillData = await GetSkillData(mr.ExchangeSkillId, cancellationToken);
                    exchangeSkillName = exchangeSkillData?.Name;
                }

                var displayResponse = new MatchRequestDisplayResponse(
                    Id: mr.Id,
                    SkillId: mr.SkillId,
                    SkillName: skillData?.Name ?? "Unknown Skill",
                    SkillCategory: skillData?.Category ?? "General",
                    Message: mr.Message,
                    Status: mr.Status.ToLowerInvariant(),
                    Type: "outgoing",
                    OtherUserId: mr.TargetUserId ?? string.Empty,
                    OtherUserName: targetUserData?.Name ?? "Unknown User",
                    OtherUserRating: targetUserData?.Rating ?? 0m,
                    OtherUserAvatar: targetUserData?.Avatar,
                    IsSkillExchange: mr.IsSkillExchange,
                    ExchangeSkillId: mr.ExchangeSkillId,
                    ExchangeSkillName: exchangeSkillName,
                    IsMonetary: mr.IsMonetaryOffer,
                    OfferedAmount: mr.OfferedAmount,
                    Currency: mr.Currency ?? "EUR",
                    SessionDurationMinutes: mr.SessionDurationMinutes ?? 60,
                    TotalSessions: mr.TotalSessions ?? 1,
                    PreferredDays: mr.PreferredDays?.ToArray() ?? Array.Empty<string>(),
                    PreferredTimes: mr.PreferredTimes?.ToArray() ?? Array.Empty<string>(),
                    CreatedAt: mr.CreatedAt,
                    RespondedAt: mr.RespondedAt,
                    ExpiresAt: mr.ExpiresAt,
                    ThreadId: mr.ThreadId,
                    IsRead: true
                );

                displayResponses.Add(displayResponse);
            }

            return Success(displayResponses, request.PageNumber, request.PageSize, totalCount);
        }
    }

    private async Task<SkillData?> GetSkillData(string skillId, CancellationToken cancellationToken)
    {
        try
        {
            var skillName = await _skillServiceClient.GetSkillNameAsync(skillId, cancellationToken);
            if (string.IsNullOrEmpty(skillName))
            {
                Logger.LogWarning("Failed to get skill name for {SkillId}", skillId);
                return new SkillData("Unknown Skill", "General");
            }

            var skillCategory = await _skillServiceClient.GetSkillCategoryAsync(skillId, cancellationToken);
            return new SkillData(skillName, skillCategory);
        }
        catch (Exception ex)
        {
            Logger.LogWarning(ex, "Error getting skill data for {SkillId}", skillId);
            return new SkillData("Unknown Skill", "General");
        }
    }

    private async Task<UserData?> GetUserData(string? userId, CancellationToken cancellationToken)
    {
        if (string.IsNullOrEmpty(userId)) return null;

        try
        {
            var userName = await _userServiceClient.GetUserNameAsync(userId, cancellationToken);
            if (string.IsNullOrEmpty(userName))
            {
                Logger.LogWarning("Failed to get user name for {UserId}", userId);
                return new UserData("Unknown User", 0m, null);
            }

            var userRating = await _userServiceClient.GetUserRatingAsync(userId, cancellationToken);
            return new UserData(userName, (decimal)userRating, null);
        }
        catch (Exception ex)
        {
            Logger.LogWarning(ex, "Error getting user data for {UserId}", userId);
            return new UserData("Unknown User", 0m, null);
        }
    }

    private record SkillData(string Name, string Category);
    private record UserData(string Name, decimal Rating, string? Avatar);

    private record SkillApiResponse(string Name, SkillCategoryResponse? Category);
    private record SkillCategoryResponse(string Name);
    private record UserProfileResponse(string FirstName, string LastName, string? ProfilePictureUrl);
}