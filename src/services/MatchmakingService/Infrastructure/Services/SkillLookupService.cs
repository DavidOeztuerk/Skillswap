// using System.Text.Json;
// using Microsoft.AspNetCore.Http;

// namespace MatchmakingService.Infrastructure.Services;

// public class SkillLookupService : ISkillLookupService
// {
//     private readonly HttpClient _httpClient;
//     private readonly ILogger<SkillLookupService> _logger;
//     private readonly IHttpContextAccessor _httpContextAccessor;

//     public SkillLookupService(HttpClient httpClient, ILogger<SkillLookupService> logger, IHttpContextAccessor httpContextAccessor)
//     {
//         _httpClient = httpClient;
//         _logger = logger;
//         _httpContextAccessor = httpContextAccessor;
//     }

//     public async Task<SkillLookupResponse?> GetSkillAsync(string skillId, CancellationToken cancellationToken = default)
//     {
//         try
//         {
//             _logger.LogInformation("Looking up skill {SkillId}", skillId);

//             Forward Authorization header from current request
//             var authHeader = _httpContextAccessor.HttpContext?.Request.Headers.Authorization.FirstOrDefault();
//             if (!string.IsNullOrEmpty(authHeader))
//             {
//                 _httpClient.DefaultRequestHeaders.Authorization = 
//                     System.Net.Http.Headers.AuthenticationHeaderValue.Parse(authHeader);
//             }

//             var response = await _httpClient.GetAsync($"/{skillId}", cancellationToken);

//             if (!response.IsSuccessStatusCode)
//             {
//                 _logger.LogWarning("Failed to get skill {SkillId}: {StatusCode}", skillId, response.StatusCode);
//                 return null;
//             }

//             var content = await response.Content.ReadAsStringAsync(cancellationToken);
//             _logger.LogInformation("SkillService response for {SkillId}: {Content}", skillId, content);

//             try
//             {
//                 var skillData = JsonSerializer.Deserialize<GetSkillDetailsApiResponse>(content, new JsonSerializerOptions
//                 {
//                     PropertyNamingPolicy = JsonNamingPolicy.CamelCase
//                 });

//                 if (skillData == null)
//                 {
//                     _logger.LogWarning("Skill {SkillId} not found or invalid response", skillId);
//                     return null;
//                 }

//                 return new SkillLookupResponse(
//                     SkillId: skillData.SkillId,
//                     Name: skillData.Name,
//                     UserId: skillData.UserId,
//                     Category: skillData.Category.Name,
//                     ProficiencyLevel: skillData.ProficiencyLevel.Name
//                 );
//             }
//             catch (JsonException ex)
//             {
//                 _logger.LogError(ex, "Failed to deserialize skill response for {SkillId}. Content: {Content}", skillId, content);
//                 return null;
//             }
//         }
//         catch (Exception ex)
//         {
//             _logger.LogError(ex, "Error looking up skill {SkillId}", skillId);
//             return null;
//         }
//     }
// }

// DTO for SkillService API response matching GetSkillDetailsResponse
// public record GetSkillDetailsApiResponse(
//     string SkillId,
//     string UserId,
//     string Name,
//     string Description,
//     bool IsOffering,
//     SkillCategoryApiResponse Category,
//     ProficiencyLevelApiResponse ProficiencyLevel,
//     List<string> Tags,
//     string? Requirements,
// );

// public record SkillCategoryApiResponse(
//     string Id,
//     string Name,
//     string Description
// );

// public record ProficiencyLevelApiResponse(
//     string Id,
//     string Name,
//     string Description,
//     int Level
// );