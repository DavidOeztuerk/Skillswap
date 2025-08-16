using System.Net.Http.Json;

namespace MatchmakingService.Infrastructure.HttpClients;

public interface ISkillServiceClient
{
    Task<string> GetSkillNameAsync(string skillId, CancellationToken cancellationToken = default);
}

public class SkillServiceClient : ISkillServiceClient
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<SkillServiceClient> _logger;

    public SkillServiceClient(HttpClient httpClient, ILogger<SkillServiceClient> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }

    public async Task<string> GetSkillNameAsync(string skillId, CancellationToken cancellationToken = default)
    {
        try
        {
            var response = await _httpClient.GetAsync($"/api/skills/{skillId}", cancellationToken);
            
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Failed to get skill {SkillId}, status: {StatusCode}", skillId, response.StatusCode);
                return "Unknown Skill";
            }

            var skill = await response.Content.ReadFromJsonAsync<SkillResponse>(cancellationToken);
            return skill?.Name ?? "Unknown Skill";
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching skill {SkillId}", skillId);
            return "Unknown Skill";
        }
    }

    private class SkillResponse
    {
        public string? Name { get; set; }
    }
}