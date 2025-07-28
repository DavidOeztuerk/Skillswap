using CQRS.Handlers;
using Infrastructure.Models;
using Infrastructure.Services;
using MatchmakingService.Application.Commands;
using MatchmakingService.Application.Queries;
using MatchmakingService.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MatchmakingService.Application.QueryHandlers;

public class GetIncomingMatchRequestsQueryHandler(
    MatchmakingDbContext dbContext,
    IUserLookupService userLookup,
    ILogger<GetIncomingMatchRequestsQueryHandler> logger)
    : BasePagedQueryHandler<GetIncomingMatchRequestsQuery, MatchRequestResponse>(logger)
{
    private readonly MatchmakingDbContext _dbContext = dbContext;
    private readonly IUserLookupService _userLookup = userLookup;

    public override async Task<PagedResponse<MatchRequestResponse>> Handle(GetIncomingMatchRequestsQuery request, CancellationToken cancellationToken)
    {
        try
        {
            if (string.IsNullOrEmpty(request.UserId))
            {
                return Success(new List<MatchRequestResponse>(), request.PageNumber, request.PageSize, 0);
            }

            // In the original MatchRequest system, there are no "incoming" requests to a specific user
            // MatchRequests are general requests that anyone can respond to
            // For now, return empty results as this concept doesn't apply to the original design
            var query = _dbContext.MatchRequests
                .Where(mr => false) // Always return empty - no incoming requests in this system
                .OrderByDescending(mr => mr.CreatedAt);

            var totalCount = await query.CountAsync(cancellationToken);

            var requests = await query
                .Skip((request.PageNumber - 1) * request.PageSize)
                .Take(request.PageSize)
                .ToListAsync(cancellationToken);

            var responses = requests?.Select(mr => new MatchRequestResponse(
                RequestId: mr.Id,
                RequesterId: mr.RequesterId,
                TargetUserId: string.Empty, // No target user in original MatchRequest system
                SkillId: mr.SkillId,
                Description: mr.Description ?? string.Empty,
                Message: mr.Message,
                Status: mr.Status,
                CreatedAt: mr.CreatedAt,
                RespondedAt: mr.RespondedAt,
                ExpiresAt: mr.ExpiresAt
            )).ToList() ?? new List<MatchRequestResponse>();

            return Success(responses, request.PageNumber, request.PageSize, totalCount);
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error getting incoming match requests for user {UserId}", request.UserId);
            return Error("An error occurred while fetching incoming match requests");
        }
    }
}
