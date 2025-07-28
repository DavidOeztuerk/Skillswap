using CQRS.Handlers;
using Infrastructure.Models;
using Infrastructure.Services;
using MatchmakingService.Application.Commands;
using MatchmakingService.Application.Queries;
using Microsoft.EntityFrameworkCore;

namespace MatchmakingService.Application.QueryHandlers;

public class GetOutgoingMatchRequestsQueryHandler(
    MatchmakingDbContext dbContext,
    IUserLookupService userLookup,
    ILogger<GetOutgoingMatchRequestsQueryHandler> logger)
    : BasePagedQueryHandler<GetOutgoingMatchRequestsQuery, MatchRequestResponse>(logger)
{
    private readonly MatchmakingDbContext _dbContext = dbContext;
    private readonly IUserLookupService _userLookup = userLookup;

    public override async Task<PagedResponse<MatchRequestResponse>> Handle(GetOutgoingMatchRequestsQuery request, CancellationToken cancellationToken)
    {
        try
        {
            Logger.LogInformation("GetOutgoingMatchRequestsQueryHandler: Starting with UserId={UserId}, PageNumber={PageNumber}, PageSize={PageSize}", 
                request.UserId, request.PageNumber, request.PageSize);

            if (string.IsNullOrEmpty(request.UserId))
            {
                Logger.LogWarning("GetOutgoingMatchRequestsQueryHandler: UserId is null or empty");
                return Success(new List<MatchRequestResponse>(), request.PageNumber, request.PageSize, 0);
            }

            Logger.LogInformation("GetOutgoingMatchRequestsQueryHandler: Querying database...");

            // Query outgoing requests where the user is the requester
            var query = _dbContext.MatchRequests
                .Where(mr => mr.RequesterId == request.UserId)
                .OrderByDescending(mr => mr.CreatedAt);

            Logger.LogInformation("GetOutgoingMatchRequestsQueryHandler: Getting count...");
            var totalCount = await query.CountAsync(cancellationToken);
            Logger.LogInformation("GetOutgoingMatchRequestsQueryHandler: Found {TotalCount} records", totalCount);

            Logger.LogInformation("GetOutgoingMatchRequestsQueryHandler: Getting paged results...");
            var requests = await query
                .Skip((request.PageNumber - 1) * request.PageSize)
                .Take(request.PageSize)
                .ToListAsync(cancellationToken);

            Logger.LogInformation("GetOutgoingMatchRequestsQueryHandler: Retrieved {Count} records from database", requests?.Count ?? 0);

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

            Logger.LogInformation("GetOutgoingMatchRequestsQueryHandler: Returning {ResponseCount} responses", responses.Count);
            
            return Success(responses, request.PageNumber, request.PageSize, totalCount);
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "GetOutgoingMatchRequestsQueryHandler: Error getting outgoing match requests for user {UserId}", request.UserId);
            return Error("An error occurred while fetching outgoing match requests");
        }
    }
}