using Contracts.Matchmaking.Responses;
using CQRS.Handlers;
using CQRS.Models;
using MatchmakingService.Application.Queries;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace MatchmakingService.Application.QueryHandlers;

public class GetIncomingMatchRequestsQueryHandler(
    MatchmakingDbContext dbContext,
    HttpClient httpClient,
    IHttpContextAccessor httpContextAccessor,
    ILogger<GetIncomingMatchRequestsQueryHandler> logger)
    : BasePagedQueryHandler<GetIncomingMatchRequestsQuery, MatchRequestDisplayResponse>(logger)
{
    private readonly MatchmakingDbContext _dbContext = dbContext;
    private readonly HttpClient _httpClient = httpClient;
    private readonly IHttpContextAccessor _httpContextAccessor = httpContextAccessor;

    public override async Task<PagedResponse<MatchRequestDisplayResponse>> Handle(
        GetIncomingMatchRequestsQuery request,
        CancellationToken cancellationToken)
    {
        try
        {
            if (string.IsNullOrEmpty(request.UserId))
            {
                return Success([], request.PageNumber, request.PageSize, 0);
            }

            // Query incoming requests where current user is the target (skill owner)
            var query = _dbContext.MatchRequests
                .Where(mr => mr.TargetUserId == request.UserId && mr.Status == "Pending")
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

                // Get requester data (the one who sent the request)
                var requesterData = await GetUserData(mr.RequesterId, cancellationToken);

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
                    Status: mr.Status?.ToLowerInvariant() ?? "pending",
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
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error getting incoming match requests for user {UserId}", request.UserId);
            return Error("An error occurred while fetching incoming match requests");
        }
    }

    private async Task<SkillData?> GetSkillData(string skillId, CancellationToken cancellationToken)
    {
        try
        {
            // Auth Token weitergeben
            var token = _httpContextAccessor.HttpContext?.Request.Headers["Authorization"]
                .FirstOrDefault()?.Split(" ").Last();
            
            if (!string.IsNullOrEmpty(token))
            {
                _httpClient.DefaultRequestHeaders.Authorization = 
                    new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
            }

            var response = await _httpClient.GetAsync($"skills/{skillId}", cancellationToken);
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
        catch (Exception ex)
        {
            Logger.LogWarning(ex, "Exception while getting skill data for {SkillId}", skillId);
            return null;
        }
    }

    private async Task<UserData?> GetUserData(string userId, CancellationToken cancellationToken)
    {
        try
        {
            // Auth Token weitergeben
            var token = _httpContextAccessor.HttpContext?.Request.Headers["Authorization"]
                .FirstOrDefault()?.Split(" ").Last();
            
            if (!string.IsNullOrEmpty(token))
            {
                _httpClient.DefaultRequestHeaders.Authorization = 
                    new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
            }

            var response = await _httpClient.GetAsync($"users/{userId}", cancellationToken);
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
        catch (Exception ex)
        {
            Logger.LogWarning(ex, "Exception while getting user data for {UserId}", userId);
            return null;
        }
    }

    private record SkillData(string Name, string Category);
    private record UserData(string Name, decimal Rating, string? Avatar);

    private record SkillApiResponse(string Name, SkillCategoryResponse? Category);
    private record SkillCategoryResponse(string Name);
    private record UserProfileResponse(string FirstName, string LastName, string? ProfilePictureUrl);
}