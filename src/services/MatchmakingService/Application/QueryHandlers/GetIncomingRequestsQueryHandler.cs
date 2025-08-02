// using CQRS.Handlers;
// using Infrastructure.Models;
// using MatchmakingService.Application.Queries;
// using Microsoft.EntityFrameworkCore;
// using Contracts.Matchmaking.Responses;

// namespace MatchmakingService.Application.QueryHandlers;

// public class GetIncomingRequestsQueryHandler(
//     MatchmakingDbContext dbContext,
//     HttpClient httpClient,
//     ILogger<GetIncomingRequestsQueryHandler> logger)
//     : BasePagedQueryHandler<GetIncomingMatchRequestsQuery, MatchRequestDisplayResponse>(logger)
// {
//     private readonly MatchmakingDbContext _dbContext = dbContext;
//     private readonly HttpClient _httpClient = httpClient;

//     public override async Task<PagedResponse<MatchRequestDisplayResponse>> Handle(
//         GetIncomingMatchRequestsQuery request,
//         CancellationToken cancellationToken)
//     {
//         try
//         {
//             var query = _dbContext.MatchRequests
//                 .Where(mr => mr.TargetUserId == request.UserId && mr.Status == "Pending")
//                 .OrderByDescending(mr => mr.CreatedAt);

//             var totalCount = await query.CountAsync(cancellationToken);
//             var totalPages = (int)Math.Ceiling((double)totalCount / request.PageSize);

//             var matchRequests = await query
//                 .Skip((request.PageNumber - 1) * request.PageSize)
//                 .Take(request.PageSize)
//                 .ToListAsync(cancellationToken);

//             var displayRequests = new List<MatchRequestDisplayResponse>();

//             foreach (var mr in matchRequests)
//             {
//                 // Get skill data from SkillService
//                 var skillData = await GetSkillData(mr.SkillId, cancellationToken);
                
//                 // Get requester data from UserService
//                 var requesterData = await GetUserData(mr.RequesterId, cancellationToken);
                
//                 // Get exchange skill data if needed
//                 string? exchangeSkillName = null;
//                 if (!string.IsNullOrEmpty(mr.ExchangeSkillId))
//                 {
//                     var exchangeSkillData = await GetSkillData(mr.ExchangeSkillId, cancellationToken);
//                     exchangeSkillName = exchangeSkillData?.Name;
//                 }

//                 var displayRequest = new MatchRequestDisplayResponse(
//                     Id: mr.Id,
//                     SkillId: mr.SkillId,
//                     SkillName: skillData?.Name ?? "Unknown Skill",
//                     SkillCategory: skillData?.Category ?? "General",
//                     Message: mr.Message,
//                     Status: mr.Status.ToLowerInvariant(),
//                     Type: "incoming",
//                     OtherUserId: mr.RequesterId,
//                     OtherUserName: requesterData?.Name ?? "Unknown User",
//                     OtherUserRating: requesterData?.Rating ?? 0m,
//                     OtherUserAvatar: requesterData?.Avatar,
//                     IsSkillExchange: mr.IsSkillExchange,
//                     ExchangeSkillId: mr.ExchangeSkillId,
//                     ExchangeSkillName: exchangeSkillName,
//                     IsMonetary: mr.IsMonetaryOffer,
//                     OfferedAmount: mr.OfferedAmount,
//                     Currency: mr.Currency,
//                     SessionDurationMinutes: mr.SessionDurationMinutes ?? 60,
//                     TotalSessions: mr.TotalSessions ?? 1,
//                     PreferredDays: mr.PreferredDays?.ToArray() ?? [],
//                     PreferredTimes: mr.PreferredTimes?.ToArray() ?? [],
//                     CreatedAt: mr.CreatedAt,
//                     RespondedAt: mr.RespondedAt,
//                     ExpiresAt: mr.ExpiresAt,
//                     ThreadId: mr.ThreadId,
//                     IsRead: true
//                 );

//                 displayRequests.Add(displayRequest);
//             }

//             var paginatedResponse = new PagedResponse<MatchRequestDisplayResponse>
//             {
//                 Data = displayRequests,
//                 PageNumber = request.PageNumber,
//                 PageSize = request.PageSize,
//                 TotalRecords = totalCount,
//                 TotalPages = totalPages,
//                 HasNextPage = request.PageNumber < totalPages,
//                 HasPreviousPage = request.PageNumber > 1
//             };

//             return Success(paginatedResponse.Data, paginatedResponse.PageNumber, paginatedResponse.PageSize, paginatedResponse.TotalRecords);
//         }
//         catch (Exception ex)
//         {
//             Logger.LogError(ex, "Error getting incoming match requests for user {UserId}", request.UserId);
//             return Error("An error occurred while retrieving incoming match requests");
//         }
//     }

//     private async Task<SkillData?> GetSkillData(string skillId, CancellationToken cancellationToken)
//     {
//         try
//         {
//             var response = await _httpClient.GetAsync($"/api/skills/{skillId}", cancellationToken);
//             if (!response.IsSuccessStatusCode) return null;

//             var apiResponse = await response.Content.ReadFromJsonAsync<ApiResponse<SkillApiResponse>>(cancellationToken: cancellationToken);
//             var skill = apiResponse?.Data;
//             return skill != null ? new SkillData(skill.Name, skill.Category?.Name ?? "General") : null;
//         }
//         catch (Exception ex)
//         {
//             Logger.LogWarning(ex, "Failed to get skill data for {SkillId}", skillId);
//             return null;
//         }
//     }

//     private async Task<UserData?> GetUserData(string userId, CancellationToken cancellationToken)
//     {
//         try
//         {
//             var response = await _httpClient.GetAsync($"/api/users/{userId}/profile", cancellationToken);
//             if (!response.IsSuccessStatusCode) return null;

//             var apiResponse = await response.Content.ReadFromJsonAsync<ApiResponse<UserProfileResponse>>(cancellationToken: cancellationToken);
//             var user = apiResponse?.Data;
//             return user != null ? new UserData(user.FirstName + " " + user.LastName, 0m, user.ProfilePictureUrl) : null;
//         }
//         catch (Exception ex)
//         {
//             Logger.LogWarning(ex, "Failed to get user data for {UserId}", userId);
//             return null;
//         }
//     }

//     private record SkillData(string Name, string Category);
//     private record UserData(string Name, decimal Rating, string? Avatar);
    
//     private record SkillApiResponse(string Name, SkillCategoryResponse? Category);
//     private record SkillCategoryResponse(string Name);
//     private record UserProfileResponse(string FirstName, string LastName, string? ProfilePictureUrl);
// }