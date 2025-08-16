using System.Net.Http.Json;

namespace MatchmakingService.Infrastructure.HttpClients;

public interface IUserServiceClient
{
    Task<string> GetUserNameAsync(string userId, CancellationToken cancellationToken = default);
}

public class UserServiceClient : IUserServiceClient
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<UserServiceClient> _logger;

    public UserServiceClient(HttpClient httpClient, ILogger<UserServiceClient> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }

    public async Task<string> GetUserNameAsync(string userId, CancellationToken cancellationToken = default)
    {
        try
        {
            var response = await _httpClient.GetAsync($"/api/users/{userId}", cancellationToken);
            
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Failed to get user {UserId}, status: {StatusCode}", userId, response.StatusCode);
                return "Unknown User";
            }

            var user = await response.Content.ReadFromJsonAsync<UserResponse>(cancellationToken);
            return $"{user?.FirstName} {user?.LastName}".Trim() ?? "Unknown User";
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching user {UserId}", userId);
            return "Unknown User";
        }
    }

    private class UserResponse
    {
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
    }
}