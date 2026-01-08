using System.Net.Http.Headers;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Web;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using UserService.Domain.Services;

namespace UserService.Infrastructure.OAuth;

/// <summary>
/// LinkedIn OAuth 2.0 service implementation
/// Phase 12: LinkedIn/Xing Integration
/// </summary>
public class LinkedInService : ILinkedInService
{
    private readonly LinkedInOptions _options;
    private readonly HttpClient _httpClient;
    private readonly ILogger<LinkedInService> _logger;

    public LinkedInService(
        IOptions<LinkedInOptions> options,
        HttpClient httpClient,
        ILogger<LinkedInService> logger)
    {
        _options = options.Value;
        _httpClient = httpClient;
        _logger = logger;
    }

    /// <inheritdoc />
    public string GetAuthorizationUrl(string state, string redirectUri)
    {
        if (!_options.IsConfigured)
        {
            _logger.LogWarning("LinkedIn OAuth is not configured");
            throw new InvalidOperationException("LinkedIn OAuth is not configured. Please set LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET.");
        }

        var scopes = string.Join(" ", _options.Scopes);
        var queryParams = new Dictionary<string, string>
        {
            ["response_type"] = "code",
            ["client_id"] = _options.ClientId,
            ["redirect_uri"] = redirectUri,
            ["state"] = state,
            ["scope"] = scopes
        };

        var queryString = string.Join("&", queryParams.Select(kvp =>
            $"{HttpUtility.UrlEncode(kvp.Key)}={HttpUtility.UrlEncode(kvp.Value)}"));

        var url = $"{_options.AuthorizationEndpoint}?{queryString}";

        _logger.LogDebug("Generated LinkedIn authorization URL for state: {State}", state);

        return url;
    }

    /// <inheritdoc />
    public async Task<LinkedInTokenResult> ExchangeCodeForTokensAsync(
        string code,
        string redirectUri,
        CancellationToken cancellationToken = default)
    {
        if (!_options.IsConfigured)
        {
            return LinkedInTokenResult.Failed("LinkedIn OAuth is not configured");
        }

        try
        {
            var requestBody = new FormUrlEncodedContent(new Dictionary<string, string>
            {
                ["grant_type"] = "authorization_code",
                ["code"] = code,
                ["redirect_uri"] = redirectUri,
                ["client_id"] = _options.ClientId,
                ["client_secret"] = _options.ClientSecret
            });

            var response = await _httpClient.PostAsync(_options.TokenEndpoint, requestBody, cancellationToken);
            var content = await response.Content.ReadAsStringAsync(cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError("LinkedIn token exchange failed: {StatusCode} - {Content}",
                    response.StatusCode, content);
                return LinkedInTokenResult.Failed($"Token exchange failed: {response.StatusCode}");
            }

            var tokenResponse = JsonSerializer.Deserialize<LinkedInTokenResponse>(content);
            if (tokenResponse == null || string.IsNullOrEmpty(tokenResponse.AccessToken))
            {
                return LinkedInTokenResult.Failed("Invalid token response from LinkedIn");
            }

            // Get user info to get LinkedIn ID and email
            var userInfo = await GetUserInfoAsync(tokenResponse.AccessToken, cancellationToken);

            var expiresAt = DateTime.UtcNow.AddSeconds(tokenResponse.ExpiresIn);

            _logger.LogInformation("Successfully exchanged code for tokens for LinkedIn user: {LinkedInId}",
                userInfo?.Sub ?? "unknown");

            return LinkedInTokenResult.Succeeded(
                tokenResponse.AccessToken,
                tokenResponse.RefreshToken,
                expiresAt,
                userInfo?.Sub ?? string.Empty,
                userInfo?.Email);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error exchanging code for LinkedIn tokens");
            return LinkedInTokenResult.Failed($"Error: {ex.Message}");
        }
    }

    /// <inheritdoc />
    public async Task<LinkedInTokenResult> RefreshAccessTokenAsync(
        string refreshToken,
        CancellationToken cancellationToken = default)
    {
        if (!_options.IsConfigured)
        {
            return LinkedInTokenResult.Failed("LinkedIn OAuth is not configured");
        }

        try
        {
            var requestBody = new FormUrlEncodedContent(new Dictionary<string, string>
            {
                ["grant_type"] = "refresh_token",
                ["refresh_token"] = refreshToken,
                ["client_id"] = _options.ClientId,
                ["client_secret"] = _options.ClientSecret
            });

            var response = await _httpClient.PostAsync(_options.TokenEndpoint, requestBody, cancellationToken);
            var content = await response.Content.ReadAsStringAsync(cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError("LinkedIn token refresh failed: {StatusCode} - {Content}",
                    response.StatusCode, content);
                return LinkedInTokenResult.Failed($"Token refresh failed: {response.StatusCode}");
            }

            var tokenResponse = JsonSerializer.Deserialize<LinkedInTokenResponse>(content);
            if (tokenResponse == null || string.IsNullOrEmpty(tokenResponse.AccessToken))
            {
                return LinkedInTokenResult.Failed("Invalid token response from LinkedIn");
            }

            var userInfo = await GetUserInfoAsync(tokenResponse.AccessToken, cancellationToken);
            var expiresAt = DateTime.UtcNow.AddSeconds(tokenResponse.ExpiresIn);

            _logger.LogInformation("Successfully refreshed LinkedIn access token");

            return LinkedInTokenResult.Succeeded(
                tokenResponse.AccessToken,
                tokenResponse.RefreshToken ?? refreshToken,
                expiresAt,
                userInfo?.Sub ?? string.Empty,
                userInfo?.Email);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error refreshing LinkedIn access token");
            return LinkedInTokenResult.Failed($"Error: {ex.Message}");
        }
    }

    /// <inheritdoc />
    public async Task<bool> RevokeAccessAsync(string accessToken, CancellationToken cancellationToken = default)
    {
        // LinkedIn doesn't have a standard token revocation endpoint
        // The user must disconnect via LinkedIn settings
        // We just return true and clean up our local data
        _logger.LogInformation("LinkedIn access revocation requested - cleaning up local data");
        return await Task.FromResult(true);
    }

    /// <inheritdoc />
    public async Task<LinkedInProfileResult> GetBasicProfileAsync(
        string accessToken,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userInfo = await GetUserInfoAsync(accessToken, cancellationToken);
            if (userInfo == null)
            {
                return LinkedInProfileResult.Failed("Failed to fetch user info from LinkedIn");
            }

            var profile = new LinkedInProfile
            {
                Id = userInfo.Sub ?? string.Empty,
                FirstName = userInfo.GivenName,
                LastName = userInfo.FamilyName,
                Email = userInfo.Email,
                ProfilePictureUrl = userInfo.Picture,
                ProfileUrl = $"https://www.linkedin.com/in/{userInfo.Sub}"
            };

            return LinkedInProfileResult.Succeeded(profile);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching basic LinkedIn profile");
            return LinkedInProfileResult.Failed($"Error: {ex.Message}");
        }
    }

    /// <inheritdoc />
    public async Task<LinkedInProfileResult> GetFullProfileAsync(
        string accessToken,
        CancellationToken cancellationToken = default)
    {
        // Note: Full profile with positions/educations requires additional API permissions
        // that are typically only available to LinkedIn partners.
        // For now, we return the basic profile.
        // When you have partner access, implement the positions/educations endpoints.

        _logger.LogWarning("Full LinkedIn profile access requires partner API permissions. Returning basic profile.");

        return await GetBasicProfileAsync(accessToken, cancellationToken);
    }

    private async Task<LinkedInUserInfo?> GetUserInfoAsync(
        string accessToken,
        CancellationToken cancellationToken)
    {
        try
        {
            var request = new HttpRequestMessage(HttpMethod.Get, _options.UserInfoEndpoint);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

            var response = await _httpClient.SendAsync(request, cancellationToken);
            var content = await response.Content.ReadAsStringAsync(cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError("LinkedIn userinfo request failed: {StatusCode} - {Content}",
                    response.StatusCode, content);
                return null;
            }

            return JsonSerializer.Deserialize<LinkedInUserInfo>(content);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching LinkedIn user info");
            return null;
        }
    }
}

#region LinkedIn API Response Models

internal class LinkedInTokenResponse
{
    [JsonPropertyName("access_token")]
    public string? AccessToken { get; set; }

    [JsonPropertyName("expires_in")]
    public int ExpiresIn { get; set; }

    [JsonPropertyName("refresh_token")]
    public string? RefreshToken { get; set; }

    [JsonPropertyName("refresh_token_expires_in")]
    public int? RefreshTokenExpiresIn { get; set; }

    [JsonPropertyName("scope")]
    public string? Scope { get; set; }

    [JsonPropertyName("token_type")]
    public string? TokenType { get; set; }
}

internal class LinkedInUserInfo
{
    [JsonPropertyName("sub")]
    public string? Sub { get; set; }

    [JsonPropertyName("name")]
    public string? Name { get; set; }

    [JsonPropertyName("given_name")]
    public string? GivenName { get; set; }

    [JsonPropertyName("family_name")]
    public string? FamilyName { get; set; }

    [JsonPropertyName("picture")]
    public string? Picture { get; set; }

    [JsonPropertyName("email")]
    public string? Email { get; set; }

    [JsonPropertyName("email_verified")]
    public bool? EmailVerified { get; set; }

    [JsonPropertyName("locale")]
    public string? Locale { get; set; }
}

#endregion
