using CQRS.Handlers;
using Microsoft.EntityFrameworkCore;
using MatchmakingService.Application.Queries;
using Contracts.Matchmaking.Responses;
using CQRS.Models;
namespace MatchmakingService.Application.QueryHandlers;

public class GetMatchRequestThreadQueryHandler(
    MatchmakingDbContext context,
    ILogger<GetMatchRequestThreadQueryHandler> logger)
    : BaseQueryHandler<GetMatchRequestThreadQuery, MatchRequestThreadResponse>(logger)
{
    private readonly MatchmakingDbContext _context = context;

    public override async Task<ApiResponse<MatchRequestThreadResponse>> Handle(
        GetMatchRequestThreadQuery query,
        CancellationToken cancellationToken)
    {
        {
            Logger.LogInformation("Getting match request thread: {ThreadId}", query.ThreadId);

            if (string.IsNullOrWhiteSpace(query.ThreadId))
            {
                Logger.LogError("ThreadId is null or empty");
                return BadRequest("ThreadId is required");
            }

            // Get all requests in this thread
            var requests = await _context.MatchRequests
                .Where(mr => mr.ThreadId == query.ThreadId)
                .OrderBy(mr => mr.CreatedAt)
                .ToListAsync(cancellationToken);

            Logger.LogInformation("Found {Count} requests for thread {ThreadId}",
                requests.Count, query.ThreadId);

            if (requests.Count == 0)
            {
                Logger.LogWarning("No match requests found for thread: {ThreadId}", query.ThreadId);
                return NotFound($"Thread {query.ThreadId} not found or not accessible");
            }

            // Get the first request to determine skill info
            var lastRequest = requests.Last();

            var response = new MatchRequestThreadResponse
            {
                ThreadId = query.ThreadId,
                SkillId = lastRequest.SkillId,
                RequesterId = lastRequest.RequesterId,
                TargetUserId = lastRequest.TargetUserId,
                Requests = requests.Select(r => new MatchRequestInThread
                {
                    Id = r.Id,
                    RequesterId = r.RequesterId,
                    Message = r.Message,
                    Status = r.Status,
                    IsSkillExchange = r.IsSkillExchange,
                    IsMonetary = r.IsMonetaryOffer,
                    OfferedAmount = r.OfferedAmount,
                    PreferredDays = r.PreferredDays,
                    PreferredTimes = r.PreferredTimes,
                    SessionDuration = r.SessionDurationMinutes ?? 60,
                    TotalSessions = r.TotalSessions ?? 1,
                    CreatedAt = r.CreatedAt,
                }).ToList(),
                LastActivity = requests.Max(r => r.UpdatedAt ?? r.CreatedAt),
                LastStatus = requests.Any(r => r.IsAccepted) ? "accepted" :
                        requests.Any(r => r.IsRejected) ? "rejected" : "active"
            };

            return Success(response);
        }
    }
}