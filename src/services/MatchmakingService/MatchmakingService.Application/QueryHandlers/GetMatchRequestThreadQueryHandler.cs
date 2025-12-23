using CQRS.Handlers;
using MatchmakingService.Application.Queries;
using Contracts.Matchmaking.Responses;
using CQRS.Models;
using MatchmakingService.Domain.Repositories;
using MatchmakingService.Domain.Services;
using Microsoft.Extensions.Logging;

namespace MatchmakingService.Application.QueryHandlers;

public class GetMatchRequestThreadQueryHandler(
    IMatchRequestRepository matchRequestRepository,
    ISkillServiceClient skillServiceClient,
    IUserServiceClient userServiceClient,
    ILogger<GetMatchRequestThreadQueryHandler> logger)
    : BaseQueryHandler<GetMatchRequestThreadQuery, MatchRequestThreadResponse>(logger)
{
    private readonly IMatchRequestRepository _matchRequestRepository = matchRequestRepository;
    private readonly ISkillServiceClient _skillServiceClient = skillServiceClient;
    private readonly IUserServiceClient _userServiceClient = userServiceClient;

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

            // Get all requests in this thread using repository
            var requests = await _matchRequestRepository.GetRequestsByThreadIdAsync(query.ThreadId, cancellationToken);

            Logger.LogInformation("Found {Count} requests for thread {ThreadId}",
                requests.Count, query.ThreadId);

            if (requests.Count == 0)
            {
                Logger.LogWarning("No match requests found for thread: {ThreadId}", query.ThreadId);
                return NotFound($"Thread {query.ThreadId} not found or not accessible");
            }

            // Get the first request to determine the original participants (requester and target)
            var firstRequest = requests.First();
            var lastRequest = requests.Last();

            // Fetch skill and user details
            var skillName = await _skillServiceClient.GetSkillNameAsync(firstRequest.SkillId, cancellationToken);
            var skillCategory = await _skillServiceClient.GetSkillCategoryAsync(firstRequest.SkillId, cancellationToken);

            // Use FIRST request to get original requester and target (they don't change in thread)
            var requesterName = await _userServiceClient.GetUserNameAsync(firstRequest.RequesterId, cancellationToken);
            var requesterRating = await _userServiceClient.GetUserRatingAsync(firstRequest.RequesterId, cancellationToken);

            var targetUserName = await _userServiceClient.GetUserNameAsync(firstRequest.TargetUserId, cancellationToken);
            var targetUserRating = await _userServiceClient.GetUserRatingAsync(firstRequest.TargetUserId, cancellationToken);

            var response = new MatchRequestThreadResponse
            {
                ThreadId = query.ThreadId,
                SkillId = firstRequest.SkillId,
                SkillName = skillName ?? "Unknown Skill",
                SkillCategory = skillCategory ?? "General",
                RequesterId = firstRequest.RequesterId,
                RequesterName = requesterName ?? "Unknown User",
                RequesterRating = (decimal)requesterRating,
                TargetUserId = firstRequest.TargetUserId,
                TargetUserName = targetUserName ?? "Unknown User",
                TargetUserRating = (decimal)targetUserRating,
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