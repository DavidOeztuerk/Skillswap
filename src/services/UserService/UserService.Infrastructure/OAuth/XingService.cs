using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Web;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using UserService.Domain.Services;

namespace UserService.Infrastructure.OAuth;

/// <summary>
/// Xing OAuth 1.0a service implementation
/// Phase 12: LinkedIn/Xing Integration
/// </summary>
public class XingService : IXingService
{
    private readonly XingOptions _options;
    private readonly HttpClient _httpClient;
    private readonly ILogger<XingService> _logger;

    public XingService(
        IOptions<XingOptions> options,
        HttpClient httpClient,
        ILogger<XingService> logger)
    {
        _options = options.Value;
        _httpClient = httpClient;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<XingRequestTokenResult> GetRequestTokenAsync(
        string callbackUrl,
        CancellationToken cancellationToken = default)
    {
        if (!_options.IsConfigured)
        {
            return XingRequestTokenResult.Failed("Xing OAuth is not configured. Please set XING_CONSUMER_KEY and XING_CONSUMER_SECRET.");
        }

        try
        {
            var oauthParams = new SortedDictionary<string, string>
            {
                ["oauth_callback"] = callbackUrl,
                ["oauth_consumer_key"] = _options.ConsumerKey,
                ["oauth_nonce"] = GenerateNonce(),
                ["oauth_signature_method"] = "HMAC-SHA1",
                ["oauth_timestamp"] = GetTimestamp(),
                ["oauth_version"] = "1.0"
            };

            // Generate signature (no token secret for request token)
            var signature = GenerateSignature("POST", _options.RequestTokenUrl, oauthParams, string.Empty);
            oauthParams["oauth_signature"] = signature;

            var authHeader = GenerateAuthorizationHeader(oauthParams);

            var request = new HttpRequestMessage(HttpMethod.Post, _options.RequestTokenUrl);
            request.Headers.Authorization = new AuthenticationHeaderValue("OAuth", authHeader);

            var response = await _httpClient.SendAsync(request, cancellationToken);
            var content = await response.Content.ReadAsStringAsync(cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError("Xing request token failed: {StatusCode} - {Content}",
                    response.StatusCode, content);
                return XingRequestTokenResult.Failed($"Request token failed: {response.StatusCode}");
            }

            var parsed = HttpUtility.ParseQueryString(content);
            var oauthToken = parsed["oauth_token"];
            var oauthTokenSecret = parsed["oauth_token_secret"];

            if (string.IsNullOrEmpty(oauthToken) || string.IsNullOrEmpty(oauthTokenSecret))
            {
                return XingRequestTokenResult.Failed("Invalid request token response from Xing");
            }

            _logger.LogDebug("Successfully obtained Xing request token");

            return XingRequestTokenResult.Succeeded(oauthToken, oauthTokenSecret);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting Xing request token");
            return XingRequestTokenResult.Failed($"Error: {ex.Message}");
        }
    }

    /// <inheritdoc />
    public string GetAuthorizationUrl(string requestToken)
    {
        return $"{_options.AuthorizeUrl}?oauth_token={HttpUtility.UrlEncode(requestToken)}";
    }

    /// <inheritdoc />
    public async Task<XingTokenResult> ExchangeVerifierForTokensAsync(
        string requestToken,
        string requestTokenSecret,
        string oauthVerifier,
        CancellationToken cancellationToken = default)
    {
        if (!_options.IsConfigured)
        {
            return XingTokenResult.Failed("Xing OAuth is not configured");
        }

        try
        {
            var oauthParams = new SortedDictionary<string, string>
            {
                ["oauth_consumer_key"] = _options.ConsumerKey,
                ["oauth_nonce"] = GenerateNonce(),
                ["oauth_signature_method"] = "HMAC-SHA1",
                ["oauth_timestamp"] = GetTimestamp(),
                ["oauth_token"] = requestToken,
                ["oauth_verifier"] = oauthVerifier,
                ["oauth_version"] = "1.0"
            };

            var signature = GenerateSignature("POST", _options.AccessTokenUrl, oauthParams, requestTokenSecret);
            oauthParams["oauth_signature"] = signature;

            var authHeader = GenerateAuthorizationHeader(oauthParams);

            var request = new HttpRequestMessage(HttpMethod.Post, _options.AccessTokenUrl);
            request.Headers.Authorization = new AuthenticationHeaderValue("OAuth", authHeader);

            var response = await _httpClient.SendAsync(request, cancellationToken);
            var content = await response.Content.ReadAsStringAsync(cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError("Xing access token exchange failed: {StatusCode} - {Content}",
                    response.StatusCode, content);
                return XingTokenResult.Failed($"Access token exchange failed: {response.StatusCode}");
            }

            var parsed = HttpUtility.ParseQueryString(content);
            var accessToken = parsed["oauth_token"];
            var tokenSecret = parsed["oauth_token_secret"];
            var userId = parsed["user_id"];

            if (string.IsNullOrEmpty(accessToken) || string.IsNullOrEmpty(tokenSecret))
            {
                return XingTokenResult.Failed("Invalid access token response from Xing");
            }

            _logger.LogInformation("Successfully obtained Xing access token for user: {UserId}", userId);

            return XingTokenResult.Succeeded(accessToken, tokenSecret, userId ?? string.Empty);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error exchanging verifier for Xing access token");
            return XingTokenResult.Failed($"Error: {ex.Message}");
        }
    }

    /// <inheritdoc />
    public async Task<XingProfileResult> GetBasicProfileAsync(
        string accessToken,
        string tokenSecret,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var oauthParams = new SortedDictionary<string, string>
            {
                ["oauth_consumer_key"] = _options.ConsumerKey,
                ["oauth_nonce"] = GenerateNonce(),
                ["oauth_signature_method"] = "HMAC-SHA1",
                ["oauth_timestamp"] = GetTimestamp(),
                ["oauth_token"] = accessToken,
                ["oauth_version"] = "1.0"
            };

            var signature = GenerateSignature("GET", _options.ProfileUrl, oauthParams, tokenSecret);
            oauthParams["oauth_signature"] = signature;

            var authHeader = GenerateAuthorizationHeader(oauthParams);

            var request = new HttpRequestMessage(HttpMethod.Get, _options.ProfileUrl);
            request.Headers.Authorization = new AuthenticationHeaderValue("OAuth", authHeader);
            request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

            var response = await _httpClient.SendAsync(request, cancellationToken);
            var content = await response.Content.ReadAsStringAsync(cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError("Xing profile fetch failed: {StatusCode} - {Content}",
                    response.StatusCode, content);
                return XingProfileResult.Failed($"Profile fetch failed: {response.StatusCode}");
            }

            var profileResponse = JsonSerializer.Deserialize<XingProfileResponse>(content);
            var user = profileResponse?.Users?.FirstOrDefault();

            if (user == null)
            {
                return XingProfileResult.Failed("No user data in Xing response");
            }

            var profile = MapToXingProfile(user);

            _logger.LogInformation("Successfully fetched Xing profile for user: {UserId}", profile.Id);

            return XingProfileResult.Succeeded(profile);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching Xing profile");
            return XingProfileResult.Failed($"Error: {ex.Message}");
        }
    }

    /// <inheritdoc />
    public async Task<XingProfileResult> GetFullProfileAsync(
        string accessToken,
        string tokenSecret,
        CancellationToken cancellationToken = default)
    {
        // For full profile, we would need to request additional fields
        // The basic profile endpoint already includes professional experience and education
        return await GetBasicProfileAsync(accessToken, tokenSecret, cancellationToken);
    }

    #region OAuth 1.0a Helper Methods

    private string GenerateNonce()
    {
        return Guid.NewGuid().ToString("N");
    }

    private string GetTimestamp()
    {
        return DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString();
    }

    private string GenerateSignature(
        string httpMethod,
        string url,
        SortedDictionary<string, string> oauthParams,
        string tokenSecret)
    {
        // Create signature base string
        var paramString = string.Join("&", oauthParams.Select(kvp =>
            $"{Uri.EscapeDataString(kvp.Key)}={Uri.EscapeDataString(kvp.Value)}"));

        var signatureBaseString = $"{httpMethod.ToUpper()}&{Uri.EscapeDataString(url)}&{Uri.EscapeDataString(paramString)}";

        // Create signing key
        var signingKey = $"{Uri.EscapeDataString(_options.ConsumerSecret)}&{Uri.EscapeDataString(tokenSecret)}";

        // Generate HMAC-SHA1 signature
        using var hmac = new HMACSHA1(Encoding.ASCII.GetBytes(signingKey));
        var hash = hmac.ComputeHash(Encoding.ASCII.GetBytes(signatureBaseString));
        return Convert.ToBase64String(hash);
    }

    private static string GenerateAuthorizationHeader(SortedDictionary<string, string> oauthParams)
    {
        return string.Join(", ", oauthParams.Select(kvp =>
            $"{Uri.EscapeDataString(kvp.Key)}=\"{Uri.EscapeDataString(kvp.Value)}\""));
    }

    #endregion

    #region Mapping Methods

    private static XingProfile MapToXingProfile(XingUserResponse user)
    {
        return new XingProfile
        {
            Id = user.Id ?? string.Empty,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Email = user.ActiveEmail,
            Permalink = user.Permalink,
            ActiveEmail = user.ActiveEmail,
            ProfessionalExperience = user.ProfessionalExperience?.Companies?
                .Select(c => new XingPosition
                {
                    Id = c.Id ?? Guid.NewGuid().ToString(),
                    Title = c.Title ?? string.Empty,
                    CompanyName = c.Name ?? string.Empty,
                    Location = c.Location,
                    Description = c.Description,
                    BeginDate = ParseXingDate(c.BeginDate),
                    EndDate = ParseXingDate(c.EndDate),
                    IsPrimary = c.IsPrimary ?? false
                })
                .ToList() ?? [],
            EducationalBackground = user.EducationalBackground?.Schools?
                .Select(s => new XingEducation
                {
                    Id = s.Id ?? Guid.NewGuid().ToString(),
                    Name = s.Name ?? string.Empty,
                    Degree = s.Degree,
                    Subject = s.Subject,
                    Notes = s.Notes,
                    BeginYear = s.BeginDate?.Year,
                    BeginMonth = s.BeginDate?.Month,
                    EndYear = s.EndDate?.Year,
                    EndMonth = s.EndDate?.Month
                })
                .ToList() ?? []
        };
    }

    private static DateTime? ParseXingDate(string? dateString)
    {
        if (string.IsNullOrEmpty(dateString))
            return null;

        if (DateTime.TryParse(dateString, out var date))
            return date;

        return null;
    }

    #endregion
}

#region Xing API Response Models

internal class XingProfileResponse
{
    [JsonPropertyName("users")]
    public List<XingUserResponse>? Users { get; set; }
}

internal class XingUserResponse
{
    [JsonPropertyName("id")]
    public string? Id { get; set; }

    [JsonPropertyName("first_name")]
    public string? FirstName { get; set; }

    [JsonPropertyName("last_name")]
    public string? LastName { get; set; }

    [JsonPropertyName("display_name")]
    public string? DisplayName { get; set; }

    [JsonPropertyName("active_email")]
    public string? ActiveEmail { get; set; }

    [JsonPropertyName("permalink")]
    public string? Permalink { get; set; }

    [JsonPropertyName("professional_experience")]
    public XingProfessionalExperience? ProfessionalExperience { get; set; }

    [JsonPropertyName("educational_background")]
    public XingEducationalBackground? EducationalBackground { get; set; }
}

internal class XingProfessionalExperience
{
    [JsonPropertyName("companies")]
    public List<XingCompany>? Companies { get; set; }
}

internal class XingCompany
{
    [JsonPropertyName("id")]
    public string? Id { get; set; }

    [JsonPropertyName("name")]
    public string? Name { get; set; }

    [JsonPropertyName("title")]
    public string? Title { get; set; }

    [JsonPropertyName("location")]
    public string? Location { get; set; }

    [JsonPropertyName("description")]
    public string? Description { get; set; }

    [JsonPropertyName("begin_date")]
    public string? BeginDate { get; set; }

    [JsonPropertyName("end_date")]
    public string? EndDate { get; set; }

    [JsonPropertyName("primary")]
    public bool? IsPrimary { get; set; }
}

internal class XingEducationalBackground
{
    [JsonPropertyName("schools")]
    public List<XingSchool>? Schools { get; set; }
}

internal class XingSchool
{
    [JsonPropertyName("id")]
    public string? Id { get; set; }

    [JsonPropertyName("name")]
    public string? Name { get; set; }

    [JsonPropertyName("degree")]
    public string? Degree { get; set; }

    [JsonPropertyName("subject")]
    public string? Subject { get; set; }

    [JsonPropertyName("notes")]
    public string? Notes { get; set; }

    [JsonPropertyName("begin_date")]
    public XingDateParts? BeginDate { get; set; }

    [JsonPropertyName("end_date")]
    public XingDateParts? EndDate { get; set; }
}

internal class XingDateParts
{
    [JsonPropertyName("year")]
    public int? Year { get; set; }

    [JsonPropertyName("month")]
    public int? Month { get; set; }
}

#endregion
