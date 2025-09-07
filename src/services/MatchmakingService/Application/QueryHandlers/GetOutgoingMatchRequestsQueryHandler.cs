using Contracts.Matchmaking.Responses;
using CQRS.Handlers;
using CQRS.Models;
using MatchmakingService.Application.Queries;
using Microsoft.EntityFrameworkCore;

namespace MatchmakingService.Application.QueryHandlers;

public class GetOutgoingMatchRequestsQueryHandler(
    MatchmakingDbContext dbContext,
    HttpClient httpClient,
    ILogger<GetOutgoingMatchRequestsQueryHandler> logger)
    : BasePagedQueryHandler<GetOutgoingMatchRequestsQuery, MatchRequestDisplayResponse>(logger)
{
    private readonly MatchmakingDbContext _dbContext = dbContext;
    private readonly HttpClient _httpClient = httpClient;

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
                .Where(mr => mr.RequesterId == request.UserId && mr.Status == "Pending")
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
        {
            var response = await _httpClient.GetAsync($"/api/skills/{skillId}", cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                Logger.LogWarning("Failed to get skill data for {SkillId}, status: {StatusCode}", skillId, response.StatusCode);
                return null;
            }

            var apiResponse = await response.Content.ReadFromJsonAsync<ApiResponse<SkillApiResponse>>(cancellationToken: cancellationToken);
            var skill = apiResponse?.Data;

            if (skill == null)
            {
                Logger.LogWarning("Skill data is null for {SkillId}", skillId);
                return null;
            }

            return new SkillData(skill.Name, skill.Category?.Name ?? "General");
        }
    }

    private async Task<UserData?> GetUserData(string? userId, CancellationToken cancellationToken)
    {
        if (string.IsNullOrEmpty(userId)) return null;

        {
            var response = await _httpClient.GetAsync($"/api/users/{userId}/profile", cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                Logger.LogWarning("Failed to get user data for {UserId}, status: {StatusCode}", userId, response.StatusCode);
                return null;
            }

            var apiResponse = await response.Content.ReadFromJsonAsync<ApiResponse<UserProfileResponse>>(cancellationToken: cancellationToken);
            var user = apiResponse?.Data;

            if (user == null)
            {
                Logger.LogWarning("User data is null for {UserId}", userId);
                return null;
            }

            var fullName = $"{user.FirstName} {user.LastName}".Trim();
            return new UserData(
                Name: string.IsNullOrEmpty(fullName) ? "Unknown User" : fullName,
                Rating: 0m, // TODO: Get actual rating when available
                Avatar: user.ProfilePictureUrl
            );
        }
    }

    private record SkillData(string Name, string Category);
    private record UserData(string Name, decimal Rating, string? Avatar);

    private record SkillApiResponse(string Name, SkillCategoryResponse? Category);
    private record SkillCategoryResponse(string Name);
    private record UserProfileResponse(string FirstName, string LastName, string? ProfilePictureUrl);
}