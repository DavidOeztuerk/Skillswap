using System.Net.Http.Json;
using Infrastructure.Models;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Services;

public class UserLookupService(
    HttpClient httpClient,
    IMemoryCache cache,
    ILogger<UserLookupService> logger) : IUserLookupService
{
    private readonly HttpClient _httpClient = httpClient;
    private readonly IMemoryCache _cache = cache;
    private readonly ILogger<UserLookupService> _logger = logger;

    public async Task<UserSummary?> GetUserAsync(string userId, CancellationToken cancellationToken = default)
    {
        var cacheKey = $"user-summary:{userId}";
        if (_cache.TryGetValue(cacheKey, out UserSummary? user))
        {
            return user;
        }

        try
        {
            var response = await _httpClient.GetAsync($"/users/{userId}", cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("User lookup for {UserId} failed with status {Status}", userId, response.StatusCode);
                return null;
            }

            var apiResponse = await response.Content.ReadFromJsonAsync<ApiResponse<UserSummary>>(cancellationToken: cancellationToken);
            user = apiResponse?.Data;
            if (user != null)
            {
                _cache.Set(cacheKey, user, TimeSpan.FromMinutes(5));
            }
            return user;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error looking up user {UserId}", userId);
            return null;
        }
    }
}
