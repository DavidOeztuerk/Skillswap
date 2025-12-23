using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Web;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using UserService.Domain.Models;
using UserService.Domain.Services;

namespace UserService.Infrastructure.Services.Calendar;

/// <summary>
/// Google Calendar API implementation
/// </summary>
public class GoogleCalendarService : ICalendarService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<GoogleCalendarService> _logger;
    private readonly string _clientId;
    private readonly string _clientSecret;
    private readonly string[] _scopes;

    private const string AuthEndpoint = "https://accounts.google.com/o/oauth2/v2/auth";
    private const string TokenEndpoint = "https://oauth2.googleapis.com/token";
    private const string RevokeEndpoint = "https://oauth2.googleapis.com/revoke";
    private const string CalendarApiBase = "https://www.googleapis.com/calendar/v3";
    private const string UserInfoEndpoint = "https://www.googleapis.com/oauth2/v2/userinfo";

    public string Provider => CalendarProviders.Google;

    public bool UsesOAuth => true;

    public GoogleCalendarService(
        HttpClient httpClient,
        IConfiguration configuration,
        ILogger<GoogleCalendarService> logger)
    {
        _httpClient = httpClient;
        _logger = logger;

        _clientId = configuration["Calendar:Google:ClientId"]
            ?? throw new InvalidOperationException("Google Calendar ClientId not configured");
        _clientSecret = configuration["Calendar:Google:ClientSecret"]
            ?? throw new InvalidOperationException("Google Calendar ClientSecret not configured");

        _scopes = new[]
        {
            "https://www.googleapis.com/auth/calendar.events",
            "https://www.googleapis.com/auth/userinfo.email"
        };
    }

    public string GetAuthorizationUrl(string state, string redirectUri)
    {
        var queryParams = HttpUtility.ParseQueryString(string.Empty);
        queryParams["client_id"] = _clientId;
        queryParams["redirect_uri"] = redirectUri;
        queryParams["response_type"] = "code";
        queryParams["scope"] = string.Join(" ", _scopes);
        queryParams["access_type"] = "offline";
        queryParams["prompt"] = "consent";
        queryParams["state"] = state;

        return $"{AuthEndpoint}?{queryParams}";
    }

    public async Task<OAuthTokenResult> ExchangeCodeForTokensAsync(string code, string redirectUri, CancellationToken cancellationToken = default)
    {
        try
        {
            var content = new FormUrlEncodedContent(new Dictionary<string, string>
            {
                ["code"] = code,
                ["client_id"] = _clientId,
                ["client_secret"] = _clientSecret,
                ["redirect_uri"] = redirectUri,
                ["grant_type"] = "authorization_code"
            });

            var response = await _httpClient.PostAsync(TokenEndpoint, content, cancellationToken);
            var responseBody = await response.Content.ReadAsStringAsync(cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError("Google token exchange failed: {Response}", responseBody);
                return OAuthTokenResult.Failed($"Token exchange failed: {response.StatusCode}");
            }

            var tokenResponse = JsonSerializer.Deserialize<GoogleTokenResponse>(responseBody);
            if (tokenResponse == null || string.IsNullOrEmpty(tokenResponse.AccessToken))
            {
                return OAuthTokenResult.Failed("Invalid token response");
            }

            var expiresAt = DateTime.UtcNow.AddSeconds(tokenResponse.ExpiresIn);

            // Get user email
            var email = await GetUserEmailAsync(tokenResponse.AccessToken, cancellationToken);

            return OAuthTokenResult.Succeeded(
                tokenResponse.AccessToken,
                tokenResponse.RefreshToken ?? "",
                expiresAt,
                email);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error exchanging Google authorization code");
            return OAuthTokenResult.Failed(ex.Message);
        }
    }

    public async Task<OAuthTokenResult> RefreshAccessTokenAsync(string refreshToken, CancellationToken cancellationToken = default)
    {
        try
        {
            var content = new FormUrlEncodedContent(new Dictionary<string, string>
            {
                ["refresh_token"] = refreshToken,
                ["client_id"] = _clientId,
                ["client_secret"] = _clientSecret,
                ["grant_type"] = "refresh_token"
            });

            var response = await _httpClient.PostAsync(TokenEndpoint, content, cancellationToken);
            var responseBody = await response.Content.ReadAsStringAsync(cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError("Google token refresh failed: {Response}", responseBody);
                return OAuthTokenResult.Failed($"Token refresh failed: {response.StatusCode}");
            }

            var tokenResponse = JsonSerializer.Deserialize<GoogleTokenResponse>(responseBody);
            if (tokenResponse == null || string.IsNullOrEmpty(tokenResponse.AccessToken))
            {
                return OAuthTokenResult.Failed("Invalid token response");
            }

            var expiresAt = DateTime.UtcNow.AddSeconds(tokenResponse.ExpiresIn);

            // Note: Google doesn't return a new refresh token on refresh
            return OAuthTokenResult.Succeeded(
                tokenResponse.AccessToken,
                refreshToken,
                expiresAt);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error refreshing Google access token");
            return OAuthTokenResult.Failed(ex.Message);
        }
    }

    public async Task<bool> RevokeAccessAsync(string accessToken, CancellationToken cancellationToken = default)
    {
        try
        {
            var response = await _httpClient.PostAsync(
                $"{RevokeEndpoint}?token={accessToken}",
                null,
                cancellationToken);

            return response.IsSuccessStatusCode;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error revoking Google access");
            return false;
        }
    }

    public async Task<CalendarOperationResult> CreateEventAsync(string accessToken, CalendarAppointment appointment, string? calendarId = null, CancellationToken cancellationToken = default)
    {
        try
        {
            var calendar = calendarId ?? "primary";
            var eventData = CreateGoogleEvent(appointment);

            var request = new HttpRequestMessage(HttpMethod.Post, $"{CalendarApiBase}/calendars/{calendar}/events");
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
            request.Content = new StringContent(JsonSerializer.Serialize(eventData), Encoding.UTF8, "application/json");

            var response = await _httpClient.SendAsync(request, cancellationToken);
            var responseBody = await response.Content.ReadAsStringAsync(cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError("Google create event failed: {Response}", responseBody);
                return CalendarOperationResult.Failed($"Create event failed: {response.StatusCode}");
            }

            var createdEvent = JsonSerializer.Deserialize<GoogleEventResponse>(responseBody);
            return CalendarOperationResult.Succeeded(createdEvent?.Id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating Google calendar event");
            return CalendarOperationResult.Failed(ex.Message);
        }
    }

    public async Task<CalendarOperationResult> UpdateEventAsync(string accessToken, string externalEventId, CalendarAppointment appointment, string? calendarId = null, CancellationToken cancellationToken = default)
    {
        try
        {
            var calendar = calendarId ?? "primary";
            var eventData = CreateGoogleEvent(appointment);

            var request = new HttpRequestMessage(HttpMethod.Put, $"{CalendarApiBase}/calendars/{calendar}/events/{externalEventId}");
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
            request.Content = new StringContent(JsonSerializer.Serialize(eventData), Encoding.UTF8, "application/json");

            var response = await _httpClient.SendAsync(request, cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                var responseBody = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogError("Google update event failed: {Response}", responseBody);
                return CalendarOperationResult.Failed($"Update event failed: {response.StatusCode}");
            }

            return CalendarOperationResult.Succeeded(externalEventId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating Google calendar event");
            return CalendarOperationResult.Failed(ex.Message);
        }
    }

    public async Task<CalendarOperationResult> DeleteEventAsync(string accessToken, string externalEventId, string? calendarId = null, CancellationToken cancellationToken = default)
    {
        try
        {
            var calendar = calendarId ?? "primary";

            var request = new HttpRequestMessage(HttpMethod.Delete, $"{CalendarApiBase}/calendars/{calendar}/events/{externalEventId}");
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

            var response = await _httpClient.SendAsync(request, cancellationToken);

            if (!response.IsSuccessStatusCode && response.StatusCode != System.Net.HttpStatusCode.NotFound)
            {
                var responseBody = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogError("Google delete event failed: {Response}", responseBody);
                return CalendarOperationResult.Failed($"Delete event failed: {response.StatusCode}");
            }

            return CalendarOperationResult.Succeeded();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting Google calendar event");
            return CalendarOperationResult.Failed(ex.Message);
        }
    }

    public async Task<string?> GetUserEmailAsync(string accessToken, CancellationToken cancellationToken = default)
    {
        try
        {
            var request = new HttpRequestMessage(HttpMethod.Get, UserInfoEndpoint);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

            var response = await _httpClient.SendAsync(request, cancellationToken);
            if (!response.IsSuccessStatusCode) return null;

            var responseBody = await response.Content.ReadAsStringAsync(cancellationToken);
            var userInfo = JsonSerializer.Deserialize<GoogleUserInfo>(responseBody);
            return userInfo?.Email;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting Google user email");
            return null;
        }
    }

    public async Task<BusyTimesResult> GetBusyTimesAsync(
        string accessToken,
        DateTime startTime,
        DateTime endTime,
        string? calendarId = null,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var calendar = calendarId ?? "primary";

            // Build FreeBusy request
            var freeBusyRequest = new
            {
                timeMin = startTime.ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ"),
                timeMax = endTime.ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ"),
                items = new[] { new { id = calendar } }
            };

            var request = new HttpRequestMessage(HttpMethod.Post, $"{CalendarApiBase}/freeBusy");
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
            request.Content = new StringContent(
                JsonSerializer.Serialize(freeBusyRequest),
                Encoding.UTF8,
                "application/json");

            var response = await _httpClient.SendAsync(request, cancellationToken);
            var responseBody = await response.Content.ReadAsStringAsync(cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError("Google FreeBusy request failed: {Response}", responseBody);
                return BusyTimesResult.Failed($"FreeBusy request failed: {response.StatusCode}");
            }

            var freeBusyResponse = JsonSerializer.Deserialize<GoogleFreeBusyResponse>(responseBody);
            if (freeBusyResponse?.Calendars == null)
            {
                return BusyTimesResult.Succeeded([]);
            }

            // Extract busy slots from response
            var busySlots = new List<CalendarBusySlot>();
            if (freeBusyResponse.Calendars.TryGetValue(calendar, out var calendarBusy))
            {
                foreach (var busy in calendarBusy.Busy ?? [])
                {
                    if (DateTime.TryParse(busy.Start, out var busyStart) &&
                        DateTime.TryParse(busy.End, out var busyEnd))
                    {
                        busySlots.Add(new CalendarBusySlot
                        {
                            Start = busyStart.ToUniversalTime(),
                            End = busyEnd.ToUniversalTime()
                        });
                    }
                }
            }

            _logger.LogInformation(
                "Retrieved {Count} busy slots from Google Calendar for range {Start} to {End}",
                busySlots.Count, startTime, endTime);

            return BusyTimesResult.Succeeded(busySlots);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting busy times from Google Calendar");
            return BusyTimesResult.Failed(ex.Message);
        }
    }

    private static object CreateGoogleEvent(CalendarAppointment appointment)
    {
        var eventObj = new Dictionary<string, object>
        {
            ["summary"] = appointment.Title,
            ["description"] = appointment.Description,
            ["start"] = new Dictionary<string, string>
            {
                ["dateTime"] = appointment.StartTime.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                ["timeZone"] = "UTC"
            },
            ["end"] = new Dictionary<string, string>
            {
                ["dateTime"] = appointment.EndTime.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                ["timeZone"] = "UTC"
            }
        };

        if (!string.IsNullOrEmpty(appointment.Location))
        {
            eventObj["location"] = appointment.Location;
        }

        if (!string.IsNullOrEmpty(appointment.MeetingLink))
        {
            eventObj["conferenceData"] = new Dictionary<string, object>
            {
                ["entryPoints"] = new[]
                {
                    new Dictionary<string, string>
                    {
                        ["entryPointType"] = "video",
                        ["uri"] = appointment.MeetingLink,
                        ["label"] = "SkillSwap Meeting"
                    }
                }
            };
        }

        if (appointment.Attendees.Count != 0)
        {
            eventObj["attendees"] = appointment.Attendees.Select(email => new Dictionary<string, string>
            {
                ["email"] = email
            }).ToList();
        }

        return eventObj;
    }

    private class GoogleTokenResponse
    {
        [JsonPropertyName("access_token")]
        public string AccessToken { get; set; } = string.Empty;

        [JsonPropertyName("refresh_token")]
        public string? RefreshToken { get; set; }

        [JsonPropertyName("expires_in")]
        public int ExpiresIn { get; set; }

        [JsonPropertyName("token_type")]
        public string TokenType { get; set; } = string.Empty;
    }

    private class GoogleEventResponse
    {
        [JsonPropertyName("id")]
        public string Id { get; set; } = string.Empty;
    }

    private class GoogleUserInfo
    {
        [JsonPropertyName("email")]
        public string Email { get; set; } = string.Empty;
    }

    private class GoogleFreeBusyResponse
    {
        [JsonPropertyName("calendars")]
        public Dictionary<string, GoogleCalendarBusy>? Calendars { get; set; }
    }

    private class GoogleCalendarBusy
    {
        [JsonPropertyName("busy")]
        public List<GoogleBusySlot>? Busy { get; set; }

        [JsonPropertyName("errors")]
        public List<GoogleBusyError>? Errors { get; set; }
    }

    private class GoogleBusySlot
    {
        [JsonPropertyName("start")]
        public string Start { get; set; } = string.Empty;

        [JsonPropertyName("end")]
        public string End { get; set; } = string.Empty;
    }

    private class GoogleBusyError
    {
        [JsonPropertyName("domain")]
        public string Domain { get; set; } = string.Empty;

        [JsonPropertyName("reason")]
        public string Reason { get; set; } = string.Empty;
    }
}
