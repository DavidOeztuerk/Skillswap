using CQRS.Handlers;
using CQRS.Models;
using Contracts.Matchmaking.Responses;
using Contracts.Skill.Responses;
using Contracts.User.Responses;
using MatchmakingService.Application.Queries;
using MatchmakingService.Domain.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Infrastructure.Communication;

namespace MatchmakingService.Application.QueryHandlers;

public class GetIncomingRequestsQueryHandler(
    IMatchmakingUnitOfWork unitOfWork,
    IServiceCommunicationManager serviceCommunication,
    ILogger<GetIncomingRequestsQueryHandler> logger)
    : BasePagedQueryHandler<GetIncomingMatchRequestsQuery, MatchRequestDisplayResponse>(logger)
{
    private readonly IMatchmakingUnitOfWork _unitOfWork = unitOfWork;
    private readonly IServiceCommunicationManager _serviceCommunication = serviceCommunication;

    public override async Task<PagedResponse<MatchRequestDisplayResponse>> Handle(
        GetIncomingMatchRequestsQuery request,
        CancellationToken cancellationToken)
    {
        try
        {
            Logger.LogInformation("Getting incoming match requests for user {UserId}, page {PageNumber}",
                request.UserId, request.PageNumber);

            var query = _unitOfWork.MatchRequests.Query
                .Where(mr => mr.TargetUserId == request.UserId && mr.Status == "Pending")
                .OrderByDescending(mr => mr.CreatedAt);

            var totalCount = await query.CountAsync(cancellationToken);

            var matchRequests = await query
                .Skip((request.PageNumber - 1) * request.PageSize)
                .Take(request.PageSize)
                .ToListAsync(cancellationToken);

            var displayRequests = new List<MatchRequestDisplayResponse>();

            foreach (var mr in matchRequests)
            {
                // Get skill data from SkillService via ServiceCommunicationManager
                var skillData = await GetSkillData(mr.SkillId, cancellationToken);

                // Get requester data from UserService via ServiceCommunicationManager
                var requesterData = await GetUserData(mr.RequesterId, cancellationToken);

                // Get exchange skill data if needed
                string? exchangeSkillName = null;
                if (!string.IsNullOrEmpty(mr.ExchangeSkillId))
                {
                    var exchangeSkillData = await GetSkillData(mr.ExchangeSkillId, cancellationToken);
                    exchangeSkillName = exchangeSkillData?.Name;
                }

                var displayRequest = new MatchRequestDisplayResponse(
                    Id: mr.Id,
                    SkillId: mr.SkillId,
                    SkillName: skillData?.Name ?? "Unknown Skill",
                    SkillCategory: skillData?.Category ?? "General",
                    Message: mr.Message,
                    Status: mr.Status.ToLowerInvariant(),
                    Type: "incoming",
                    OtherUserId: mr.RequesterId,
                    OtherUserName: requesterData?.Name ?? "Unknown User",
                    OtherUserRating: requesterData?.Rating ?? 0m,
                    OtherUserAvatar: requesterData?.Avatar,
                    IsSkillExchange: mr.IsSkillExchange,
                    ExchangeSkillId: mr.ExchangeSkillId,
                    ExchangeSkillName: exchangeSkillName,
                    IsMonetary: mr.IsMonetaryOffer,
                    OfferedAmount: mr.OfferedAmount,
                    Currency: mr.Currency,
                    SessionDurationMinutes: mr.SessionDurationMinutes ?? 60,
                    TotalSessions: mr.TotalSessions ?? 1,
                    PreferredDays: mr.PreferredDays?.ToArray() ?? [],
                    PreferredTimes: mr.PreferredTimes?.ToArray() ?? [],
                    CreatedAt: mr.CreatedAt,
                    RespondedAt: mr.RespondedAt,
                    ExpiresAt: mr.ExpiresAt,
                    ThreadId: mr.ThreadId,
                    IsRead: true
                );

                displayRequests.Add(displayRequest);
            }

            Logger.LogInformation("Found {Count} incoming match requests for user {UserId}",
                displayRequests.Count, request.UserId);

            return Success(displayRequests, request.PageNumber, request.PageSize, totalCount);
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error getting incoming match requests for user {UserId}", request.UserId);
            return Error("An error occurred while retrieving incoming match requests");
        }
    }

    private async Task<SkillData?> GetSkillData(string skillId, CancellationToken cancellationToken)
    {
        try
        {
            var skill = await _serviceCommunication.GetAsync<SkillDetailsResponse>(
                "SkillService",
                $"/api/skills/{skillId}",
                cancellationToken);

            return skill != null ? new SkillData(skill.Name, skill.Category?.Name ?? "General") : null;
        }
        catch (Exception ex)
        {
            Logger.LogWarning(ex, "Failed to get skill data for {SkillId}", skillId);
            return null;
        }
    }

    private async Task<UserData?> GetUserData(string userId, CancellationToken cancellationToken)
    {
        try
        {
            var user = await _serviceCommunication.GetAsync<UserProfileResponse>(
                "UserService",
                $"/api/users/{userId}/profile",
                cancellationToken);

            return user != null ? new UserData(user.FirstName + " " + user.LastName, 0m, user.ProfilePictureUrl) : null;
        }
        catch (Exception ex)
        {
            Logger.LogWarning(ex, "Failed to get user data for {UserId}", userId);
            return null;
        }
    }

    private record SkillData(string Name, string Category);
    private record UserData(string Name, decimal Rating, string? Avatar);
}
