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
/// Microsoft Graph Calendar API implementation
/// </summary>
public class MicrosoftCalendarService : ICalendarService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<MicrosoftCalendarService> _logger;
    private readonly string _clientId;
    private readonly string _clientSecret;
    private readonly string _tenantId;
    private readonly string[] _scopes;

    private const string GraphApiBase = "https://graph.microsoft.com/v1.0";

    public string Provider => CalendarProviders.Microsoft;

    public bool UsesOAuth => true;

    public MicrosoftCalendarService(
        HttpClient httpClient,
        IConfiguration configuration,
        ILogger<MicrosoftCalendarService> logger)
    {
        _httpClient = httpClient;
        _logger = logger;

        _clientId = configuration["Calendar:Microsoft:ClientId"]
            ?? throw new InvalidOperationException("Microsoft Calendar ClientId not configured");
        _clientSecret = configuration["Calendar:Microsoft:ClientSecret"]
            ?? throw new InvalidOperationException("Microsoft Calendar ClientSecret not configured");
        _tenantId = configuration["Calendar:Microsoft:TenantId"] ?? "common";

        _scopes = new[]
        {
            "Calendars.ReadWrite",
            "User.Read",
            "offline_access"
        };
    }

    private string AuthEndpoint => $"https://login.microsoftonline.com/{_tenantId}/oauth2/v2.0/authorize";
    private string TokenEndpoint => $"https://login.microsoftonline.com/{_tenantId}/oauth2/v2.0/token";

    public string GetAuthorizationUrl(string state, string redirectUri)
    {
        var queryParams = HttpUtility.ParseQueryString(string.Empty);
        queryParams["client_id"] = _clientId;
        queryParams["redirect_uri"] = redirectUri;
        queryParams["response_type"] = "code";
        queryParams["scope"] = string.Join(" ", _scopes);
        queryParams["response_mode"] = "query";
        queryParams["state"] = state;
        queryParams["prompt"] = "consent";

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
                ["grant_type"] = "authorization_code",
                ["scope"] = string.Join(" ", _scopes)
            });

            var response = await _httpClient.PostAsync(TokenEndpoint, content, cancellationToken);
            var responseBody = await response.Content.ReadAsStringAsync(cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError("Microsoft token exchange failed: {Response}", responseBody);
                return OAuthTokenResult.Failed($"Token exchange failed: {response.StatusCode}");
            }

            var tokenResponse = JsonSerializer.Deserialize<MicrosoftTokenResponse>(responseBody);
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
            _logger.LogError(ex, "Error exchanging Microsoft authorization code");
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
                ["grant_type"] = "refresh_token",
                ["scope"] = string.Join(" ", _scopes)
            });

            var response = await _httpClient.PostAsync(TokenEndpoint, content, cancellationToken);
            var responseBody = await response.Content.ReadAsStringAsync(cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError("Microsoft token refresh failed: {Response}", responseBody);
                return OAuthTokenResult.Failed($"Token refresh failed: {response.StatusCode}");
            }

            var tokenResponse = JsonSerializer.Deserialize<MicrosoftTokenResponse>(responseBody);
            if (tokenResponse == null || string.IsNullOrEmpty(tokenResponse.AccessToken))
            {
                return OAuthTokenResult.Failed("Invalid token response");
            }

            var expiresAt = DateTime.UtcNow.AddSeconds(tokenResponse.ExpiresIn);

            return OAuthTokenResult.Succeeded(
                tokenResponse.AccessToken,
                tokenResponse.RefreshToken ?? refreshToken,
                expiresAt);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error refreshing Microsoft access token");
            return OAuthTokenResult.Failed(ex.Message);
        }
    }

    public async Task<bool> RevokeAccessAsync(string accessToken, CancellationToken cancellationToken = default)
    {
        // Microsoft Graph doesn't have a direct revoke endpoint
        // The token will expire naturally, and the user can revoke via account settings
        _logger.LogInformation("Microsoft OAuth revoke requested - tokens will expire naturally");
        return await Task.FromResult(true);
    }

    public async Task<CalendarOperationResult> CreateEventAsync(string accessToken, CalendarAppointment appointment, string? calendarId = null, CancellationToken cancellationToken = default)
    {
        try
        {
            var endpoint = string.IsNullOrEmpty(calendarId)
                ? $"{GraphApiBase}/me/calendar/events"
                : $"{GraphApiBase}/me/calendars/{calendarId}/events";

            var eventData = CreateMicrosoftEvent(appointment);

            var request = new HttpRequestMessage(HttpMethod.Post, endpoint);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
            request.Content = new StringContent(JsonSerializer.Serialize(eventData), Encoding.UTF8, "application/json");

            var response = await _httpClient.SendAsync(request, cancellationToken);
            var responseBody = await response.Content.ReadAsStringAsync(cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError("Microsoft create event failed: {Response}", responseBody);
                return CalendarOperationResult.Failed($"Create event failed: {response.StatusCode}");
            }

            var createdEvent = JsonSerializer.Deserialize<MicrosoftEventResponse>(responseBody);
            return CalendarOperationResult.Succeeded(createdEvent?.Id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating Microsoft calendar event");
            return CalendarOperationResult.Failed(ex.Message);
        }
    }

    public async Task<CalendarOperationResult> UpdateEventAsync(string accessToken, string externalEventId, CalendarAppointment appointment, string? calendarId = null, CancellationToken cancellationToken = default)
    {
        try
        {
            var endpoint = string.IsNullOrEmpty(calendarId)
                ? $"{GraphApiBase}/me/calendar/events/{externalEventId}"
                : $"{GraphApiBase}/me/calendars/{calendarId}/events/{externalEventId}";

            var eventData = CreateMicrosoftEvent(appointment);

            var request = new HttpRequestMessage(HttpMethod.Patch, endpoint);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
            request.Content = new StringContent(JsonSerializer.Serialize(eventData), Encoding.UTF8, "application/json");

            var response = await _httpClient.SendAsync(request, cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                var responseBody = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogError("Microsoft update event failed: {Response}", responseBody);
                return CalendarOperationResult.Failed($"Update event failed: {response.StatusCode}");
            }

            return CalendarOperationResult.Succeeded(externalEventId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating Microsoft calendar event");
            return CalendarOperationResult.Failed(ex.Message);
        }
    }

    public async Task<CalendarOperationResult> DeleteEventAsync(string accessToken, string externalEventId, string? calendarId = null, CancellationToken cancellationToken = default)
    {
        try
        {
            var endpoint = string.IsNullOrEmpty(calendarId)
                ? $"{GraphApiBase}/me/calendar/events/{externalEventId}"
                : $"{GraphApiBase}/me/calendars/{calendarId}/events/{externalEventId}";

            var request = new HttpRequestMessage(HttpMethod.Delete, endpoint);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

            var response = await _httpClient.SendAsync(request, cancellationToken);

            if (!response.IsSuccessStatusCode && response.StatusCode != System.Net.HttpStatusCode.NotFound)
            {
                var responseBody = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogError("Microsoft delete event failed: {Response}", responseBody);
                return CalendarOperationResult.Failed($"Delete event failed: {response.StatusCode}");
            }

            return CalendarOperationResult.Succeeded();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting Microsoft calendar event");
            return CalendarOperationResult.Failed(ex.Message);
        }
    }

    public async Task<string?> GetUserEmailAsync(string accessToken, CancellationToken cancellationToken = default)
    {
        try
        {
            var request = new HttpRequestMessage(HttpMethod.Get, $"{GraphApiBase}/me");
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

            var response = await _httpClient.SendAsync(request, cancellationToken);
            if (!response.IsSuccessStatusCode) return null;

            var responseBody = await response.Content.ReadAsStringAsync(cancellationToken);
            var userInfo = JsonSerializer.Deserialize<MicrosoftUserInfo>(responseBody);
            return userInfo?.UserPrincipalName ?? userInfo?.Mail;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting Microsoft user email");
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
            // Build calendarView request to get events in range
            var startTimeStr = startTime.ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ");
            var endTimeStr = endTime.ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ");

            var endpoint = string.IsNullOrEmpty(calendarId)
                ? $"{GraphApiBase}/me/calendarView?startDateTime={startTimeStr}&endDateTime={endTimeStr}&$select=subject,start,end,showAs"
                : $"{GraphApiBase}/me/calendars/{calendarId}/calendarView?startDateTime={startTimeStr}&endDateTime={endTimeStr}&$select=subject,start,end,showAs";

            var request = new HttpRequestMessage(HttpMethod.Get, endpoint);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
            request.Headers.Add("Prefer", "outlook.timezone=\"UTC\"");

            var response = await _httpClient.SendAsync(request, cancellationToken);
            var responseBody = await response.Content.ReadAsStringAsync(cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError("Microsoft calendarView request failed: {Response}", responseBody);
                return BusyTimesResult.Failed($"CalendarView request failed: {response.StatusCode}");
            }

            var calendarViewResponse = JsonSerializer.Deserialize<MicrosoftCalendarViewResponse>(responseBody);
            if (calendarViewResponse?.Value == null)
            {
                return BusyTimesResult.Succeeded([]);
            }

            // Extract busy slots - only include events that show as busy or tentative
            var busySlots = new List<CalendarBusySlot>();
            foreach (var eventItem in calendarViewResponse.Value)
            {
                // Skip events marked as free or working elsewhere
                if (eventItem.ShowAs == "free" || eventItem.ShowAs == "workingElsewhere")
                    continue;

                if (eventItem.Start?.DateTime != null && eventItem.End?.DateTime != null)
                {
                    if (DateTime.TryParse(eventItem.Start.DateTime, out var busyStart) &&
                        DateTime.TryParse(eventItem.End.DateTime, out var busyEnd))
                    {
                        busySlots.Add(new CalendarBusySlot
                        {
                            Start = busyStart.ToUniversalTime(),
                            End = busyEnd.ToUniversalTime(),
                            Title = eventItem.Subject // Microsoft returns subject
                        });
                    }
                }
            }

            _logger.LogInformation(
                "Retrieved {Count} busy slots from Microsoft Calendar for range {Start} to {End}",
                busySlots.Count, startTime, endTime);

            return BusyTimesResult.Succeeded(busySlots);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting busy times from Microsoft Calendar");
            return BusyTimesResult.Failed(ex.Message);
        }
    }

    private static object CreateMicrosoftEvent(CalendarAppointment appointment)
    {
        var eventObj = new Dictionary<string, object>
        {
            ["subject"] = appointment.Title,
            ["body"] = new Dictionary<string, string>
            {
                ["contentType"] = "HTML",
                ["content"] = appointment.Description
            },
            ["start"] = new Dictionary<string, string>
            {
                ["dateTime"] = appointment.StartTime.ToString("yyyy-MM-ddTHH:mm:ss"),
                ["timeZone"] = "UTC"
            },
            ["end"] = new Dictionary<string, string>
            {
                ["dateTime"] = appointment.EndTime.ToString("yyyy-MM-ddTHH:mm:ss"),
                ["timeZone"] = "UTC"
            }
        };

        if (!string.IsNullOrEmpty(appointment.Location))
        {
            eventObj["location"] = new Dictionary<string, string>
            {
                ["displayName"] = appointment.Location
            };
        }

        if (!string.IsNullOrEmpty(appointment.MeetingLink))
        {
            eventObj["isOnlineMeeting"] = true;
            eventObj["onlineMeetingUrl"] = appointment.MeetingLink;
        }

        if (appointment.Attendees.Count != 0)
        {
            eventObj["attendees"] = appointment.Attendees.Select(email => new Dictionary<string, object>
            {
                ["emailAddress"] = new Dictionary<string, string>
                {
                    ["address"] = email
                },
                ["type"] = "required"
            }).ToList();
        }

        return eventObj;
    }

    private class MicrosoftTokenResponse
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

    private class MicrosoftEventResponse
    {
        [JsonPropertyName("id")]
        public string Id { get; set; } = string.Empty;
    }

    private class MicrosoftUserInfo
    {
        [JsonPropertyName("mail")]
        public string? Mail { get; set; }

        [JsonPropertyName("userPrincipalName")]
        public string? UserPrincipalName { get; set; }
    }

    private class MicrosoftCalendarViewResponse
    {
        [JsonPropertyName("value")]
        public List<MicrosoftCalendarEvent>? Value { get; set; }
    }

    private class MicrosoftCalendarEvent
    {
        [JsonPropertyName("subject")]
        public string? Subject { get; set; }

        [JsonPropertyName("start")]
        public MicrosoftDateTime? Start { get; set; }

        [JsonPropertyName("end")]
        public MicrosoftDateTime? End { get; set; }

        [JsonPropertyName("showAs")]
        public string? ShowAs { get; set; } // free, tentative, busy, oof, workingElsewhere
    }

    private class MicrosoftDateTime
    {
        [JsonPropertyName("dateTime")]
        public string? DateTime { get; set; }

        [JsonPropertyName("timeZone")]
        public string? TimeZone { get; set; }
    }
}
