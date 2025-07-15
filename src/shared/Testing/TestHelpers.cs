using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.IdentityModel.Tokens;

namespace Testing;

/// <summary>
/// Helper methods for testing
/// </summary>
public static class TestHelpers
{
    /// <summary>
    /// Creates HTTP content from an object
    /// </summary>
    public static StringContent CreateJsonContent(object obj)
    {
        var json = JsonSerializer.Serialize(obj, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });
        return new StringContent(json, Encoding.UTF8, "application/json");
    }

    /// <summary>
    /// Deserializes HTTP response content to an object
    /// </summary>
    public static async Task<T> ReadJsonAsync<T>(HttpResponseMessage response)
    {
        var content = await response.Content.ReadAsStringAsync();
        return JsonSerializer.Deserialize<T>(content, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        })!;
    }

    /// <summary>
    /// Adds JWT authentication token to HTTP client
    /// </summary>
    public static void AddJwtToken(this HttpClient client, string token)
    {
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
    }

    /// <summary>
    /// Generates a test JWT token
    /// </summary>
    public static string GenerateJwtToken(
        string userId = "test-user-id",
        string email = "test@example.com",
        string[] roles = null,
        string secret = "test-secret-key-for-jwt-token-generation-12345")
    {
        var tokenHandler = new JwtSecurityTokenHandler();
        var key = Encoding.ASCII.GetBytes(secret);
        
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, userId),
            new(ClaimTypes.Email, email),
            new("sub", userId),
            new("email", email)
        };

        if (roles != null)
        {
            claims.AddRange(roles.Select(role => new Claim(ClaimTypes.Role, role)));
        }

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddHours(1),
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        };

        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }

    /// <summary>
    /// Generates a test JWT token for admin user
    /// </summary>
    public static string GenerateAdminJwtToken(
        string userId = "admin-user-id",
        string email = "admin@example.com",
        string secret = "test-secret-key-for-jwt-token-generation-12345")
    {
        return GenerateJwtToken(userId, email, new[] { "Admin" }, secret);
    }

    /// <summary>
    /// Waits for a condition to be true with timeout
    /// </summary>
    public static async Task<bool> WaitForConditionAsync(
        Func<Task<bool>> condition,
        TimeSpan timeout,
        TimeSpan? checkInterval = null)
    {
        checkInterval ??= TimeSpan.FromMilliseconds(100);
        var endTime = DateTime.UtcNow + timeout;

        while (DateTime.UtcNow < endTime)
        {
            if (await condition())
                return true;

            await Task.Delay(checkInterval.Value);
        }

        return false;
    }

    /// <summary>
    /// Waits for a condition to be true with timeout (synchronous version)
    /// </summary>
    public static bool WaitForCondition(
        Func<bool> condition,
        TimeSpan timeout,
        TimeSpan? checkInterval = null)
    {
        checkInterval ??= TimeSpan.FromMilliseconds(100);
        var endTime = DateTime.UtcNow + timeout;

        while (DateTime.UtcNow < endTime)
        {
            if (condition())
                return true;

            Thread.Sleep(checkInterval.Value);
        }

        return false;
    }

    /// <summary>
    /// Creates a mock HTTP response message
    /// </summary>
    public static HttpResponseMessage CreateMockResponse(object content, System.Net.HttpStatusCode statusCode = System.Net.HttpStatusCode.OK)
    {
        var json = JsonSerializer.Serialize(content, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });

        return new HttpResponseMessage(statusCode)
        {
            Content = new StringContent(json, Encoding.UTF8, "application/json")
        };
    }

    /// <summary>
    /// Retries an async operation with exponential backoff
    /// </summary>
    public static async Task<T> RetryAsync<T>(
        Func<Task<T>> operation,
        int maxRetries = 3,
        TimeSpan? baseDelay = null)
    {
        baseDelay ??= TimeSpan.FromSeconds(1);
        
        for (int i = 0; i < maxRetries; i++)
        {
            try
            {
                return await operation();
            }
            catch (Exception ex) when (i < maxRetries - 1)
            {
                var delay = TimeSpan.FromMilliseconds(baseDelay.Value.TotalMilliseconds * Math.Pow(2, i));
                await Task.Delay(delay);
            }
        }

        return await operation(); // Let the last attempt throw if it fails
    }
}