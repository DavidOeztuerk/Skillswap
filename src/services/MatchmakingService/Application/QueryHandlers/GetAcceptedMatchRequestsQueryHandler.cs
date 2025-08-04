using CQRS.Handlers;
using Microsoft.EntityFrameworkCore;
using Contracts.Matchmaking.Responses;
using MatchmakingService.Application.Queries;
using CQRS.Models;

namespace MatchmakingService.Application.QueryHandlers;

public class GetAcceptedMatchRequestsQueryHandler(
    MatchmakingDbContext dbContext,
    ILogger<GetAcceptedMatchRequestsQueryHandler> logger)
    : BasePagedQueryHandler<GetAcceptedMatchRequestsQuery, MatchRequestDisplayResponse>(logger)
{
    private readonly MatchmakingDbContext _dbContext = dbContext;

    public override async Task<PagedResponse<MatchRequestDisplayResponse>> Handle(
        GetAcceptedMatchRequestsQuery request,
         CancellationToken cancellationToken)
    {
        try
        {
            if (string.IsNullOrEmpty(request.UserId))
            {
                return Success(new List<MatchRequestDisplayResponse>(), request.PageNumber, request.PageSize, 0);
            }

            Logger.LogInformation("Getting accepted match requests for user: {UserId}", request.UserId);

            var requests = await _dbContext.MatchRequests
                .Where(mr => (mr.RequesterId == request.UserId || mr.TargetUserId == request.UserId)
                           && mr.Status == "Accepted")
                .OrderByDescending(mr => mr.UpdatedAt ?? mr.CreatedAt)
                .Skip((request.PageNumber - 1) * request.PageSize)
                .Take(request.PageSize)
                .ToListAsync(cancellationToken);

            var totalCount = await _dbContext.MatchRequests
                .CountAsync(mr => (mr.RequesterId == request.UserId || mr.TargetUserId == request.UserId)
                                && mr.Status == "Accepted", cancellationToken);

            var responses = requests.Select(r =>
            {
                // Determine the other user and type based on current user's role
                var isRequester = r.RequesterId == request.UserId;
                var otherUserId = isRequester ? r.TargetUserId ?? "" : r.RequesterId;
                var type = isRequester ? "outgoing" : "incoming";

                return new MatchRequestDisplayResponse(
                    Id: r.Id,
                    SkillId: r.SkillId,
                    SkillName: r.Description ?? "Unknown Skill", // Placeholder
                    SkillCategory: "General", // Placeholder
                    Message: r.Message,
                    Status: r.Status.ToLowerInvariant(),
                    Type: type,
                    OtherUserId: otherUserId,
                    OtherUserName: "Other User", // Placeholder
                    OtherUserRating: 0m, // Placeholder
                    OtherUserAvatar: null,
                    IsSkillExchange: r.IsSkillExchange,
                    ExchangeSkillId: r.ExchangeSkillId,
                    ExchangeSkillName: "Exchange Skill", // Placeholder
                    IsMonetary: r.IsMonetaryOffer,
                    OfferedAmount: r.OfferedAmount,
                    Currency: r.Currency ?? "EUR",
                    SessionDurationMinutes: r.SessionDurationMinutes ?? 60,
                    TotalSessions: r.TotalSessions ?? 1,
                    PreferredDays: r.PreferredDays?.ToArray() ?? Array.Empty<string>(),
                    PreferredTimes: r.PreferredTimes?.ToArray() ?? Array.Empty<string>(),
                    CreatedAt: r.CreatedAt,
                    RespondedAt: r.RespondedAt,
                    ExpiresAt: r.ExpiresAt,
                    ThreadId: r.ThreadId,
                    IsRead: true
                );
            }).ToList();

            return Success(responses, request.PageNumber, request.PageSize, totalCount);
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error getting accepted match requests for user: {UserId}", request.UserId);
            return Error("An error occurred while fetching accepted match requests");
        }
    }
}