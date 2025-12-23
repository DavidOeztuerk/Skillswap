using System.Net;
using System.Net.Http.Headers;
using System.Text;
using System.Text.RegularExpressions;
using System.Xml.Linq;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using UserService.Domain.Models;
using UserService.Domain.Services;

namespace UserService.Infrastructure.Services.Calendar;

/// <summary>
/// Apple iCloud Calendar implementation using CalDAV protocol
/// Unlike Google/Microsoft, Apple uses CalDAV with app-specific password authentication
/// </summary>
public partial class AppleCalendarService : ICalendarService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<AppleCalendarService> _logger;

    private const string CalDavBase = "https://caldav.icloud.com";

    // XML namespaces for CalDAV
    private static readonly XNamespace DavNs = "DAV:";
    private static readonly XNamespace CalDavNs = "urn:ietf:params:xml:ns:caldav";
    private static readonly XNamespace ICalNs = "http://apple.com/ns/ical/";

    public string Provider => CalendarProviders.Apple;

    /// <summary>
    /// Apple uses CalDAV with Basic Auth, not OAuth
    /// </summary>
    public bool UsesOAuth => false;

    public AppleCalendarService(
        HttpClient httpClient,
        IConfiguration configuration,
        ILogger<AppleCalendarService> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }

    /// <summary>
    /// Apple doesn't use OAuth - this returns instructions for app-specific password setup
    /// </summary>
    public string GetAuthorizationUrl(string state, string redirectUri)
    {
        // Return a URL that explains how to set up app-specific password
        // In practice, the frontend will show a form for Apple ID + app-specific password
        return $"https://appleid.apple.com/account/manage?state={state}";
    }

    /// <summary>
    /// For Apple, the "code" is actually the credentials in format "appleId:appSpecificPassword"
    /// </summary>
    public async Task<OAuthTokenResult> ExchangeCodeForTokensAsync(string code, string redirectUri, CancellationToken cancellationToken = default)
    {
        try
        {
            // The code is expected to be "appleId:appSpecificPassword"
            var credentials = code.Split(':');
            if (credentials.Length != 2)
            {
                return OAuthTokenResult.Failed("Invalid credentials format. Expected 'appleId:appSpecificPassword'");
            }

            var appleId = credentials[0];
            var appPassword = credentials[1];

            // Verify credentials by attempting to access CalDAV
            var isValid = await VerifyCredentialsAsync(appleId, appPassword, cancellationToken);
            if (!isValid)
            {
                return OAuthTokenResult.Failed("Invalid Apple ID or app-specific password");
            }

            // For CalDAV, we store credentials directly (they don't expire)
            // The "access token" is the base64 encoded credentials
            var accessToken = Convert.ToBase64String(Encoding.UTF8.GetBytes(code));

            return OAuthTokenResult.Succeeded(
                accessToken,
                "", // No refresh token for CalDAV
                DateTime.MaxValue, // Doesn't expire (until user revokes app-specific password)
                appleId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating Apple CalDAV credentials");
            return OAuthTokenResult.Failed(ex.Message);
        }
    }

    /// <summary>
    /// CalDAV credentials don't expire, so refresh just validates they still work
    /// </summary>
    public async Task<OAuthTokenResult> RefreshAccessTokenAsync(string refreshToken, CancellationToken cancellationToken = default)
    {
        // For CalDAV, the access token contains the credentials
        // We just need to verify they still work
        return await Task.FromResult(OAuthTokenResult.Failed("Apple CalDAV doesn't require token refresh"));
    }

    /// <summary>
    /// For Apple, revoking means the user should delete their app-specific password
    /// </summary>
    public Task<bool> RevokeAccessAsync(string accessToken, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Apple CalDAV revoke requested - user should delete app-specific password at appleid.apple.com");
        return Task.FromResult(true);
    }

    public async Task<CalendarOperationResult> CreateEventAsync(string accessToken, CalendarAppointment appointment, string? calendarId = null, CancellationToken cancellationToken = default)
    {
        try
        {
            var (appleId, appPassword) = DecodeCredentials(accessToken);
            var calendar = calendarId ?? await GetDefaultCalendarPathAsync(appleId, appPassword, cancellationToken);

            if (string.IsNullOrEmpty(calendar))
            {
                return CalendarOperationResult.Failed("Could not determine calendar path");
            }

            var eventUid = Guid.NewGuid().ToString();
            var icalContent = CreateICalEvent(appointment, eventUid);
            var eventPath = $"{calendar}{eventUid}.ics";

            var request = new HttpRequestMessage(HttpMethod.Put, $"{CalDavBase}{eventPath}");
            SetBasicAuth(request, appleId, appPassword);
            request.Content = new StringContent(icalContent, Encoding.UTF8, "text/calendar");

            var response = await _httpClient.SendAsync(request, cancellationToken);

            if (response.StatusCode != HttpStatusCode.Created && response.StatusCode != HttpStatusCode.NoContent)
            {
                var responseBody = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogError("Apple CalDAV create event failed: {Status} - {Response}", response.StatusCode, responseBody);
                return CalendarOperationResult.Failed($"Create event failed: {response.StatusCode}");
            }

            return CalendarOperationResult.Succeeded(eventUid);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating Apple calendar event");
            return CalendarOperationResult.Failed(ex.Message);
        }
    }

    public async Task<CalendarOperationResult> UpdateEventAsync(string accessToken, string externalEventId, CalendarAppointment appointment, string? calendarId = null, CancellationToken cancellationToken = default)
    {
        try
        {
            var (appleId, appPassword) = DecodeCredentials(accessToken);
            var calendar = calendarId ?? await GetDefaultCalendarPathAsync(appleId, appPassword, cancellationToken);

            if (string.IsNullOrEmpty(calendar))
            {
                return CalendarOperationResult.Failed("Could not determine calendar path");
            }

            var icalContent = CreateICalEvent(appointment, externalEventId);
            var eventPath = $"{calendar}{externalEventId}.ics";

            var request = new HttpRequestMessage(HttpMethod.Put, $"{CalDavBase}{eventPath}");
            SetBasicAuth(request, appleId, appPassword);
            request.Content = new StringContent(icalContent, Encoding.UTF8, "text/calendar");

            var response = await _httpClient.SendAsync(request, cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                var responseBody = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogError("Apple CalDAV update event failed: {Status} - {Response}", response.StatusCode, responseBody);
                return CalendarOperationResult.Failed($"Update event failed: {response.StatusCode}");
            }

            return CalendarOperationResult.Succeeded(externalEventId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating Apple calendar event");
            return CalendarOperationResult.Failed(ex.Message);
        }
    }

    public async Task<CalendarOperationResult> DeleteEventAsync(string accessToken, string externalEventId, string? calendarId = null, CancellationToken cancellationToken = default)
    {
        try
        {
            var (appleId, appPassword) = DecodeCredentials(accessToken);
            var calendar = calendarId ?? await GetDefaultCalendarPathAsync(appleId, appPassword, cancellationToken);

            if (string.IsNullOrEmpty(calendar))
            {
                return CalendarOperationResult.Failed("Could not determine calendar path");
            }

            var eventPath = $"{calendar}{externalEventId}.ics";

            var request = new HttpRequestMessage(HttpMethod.Delete, $"{CalDavBase}{eventPath}");
            SetBasicAuth(request, appleId, appPassword);

            var response = await _httpClient.SendAsync(request, cancellationToken);

            if (!response.IsSuccessStatusCode && response.StatusCode != HttpStatusCode.NotFound)
            {
                var responseBody = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogError("Apple CalDAV delete event failed: {Status} - {Response}", response.StatusCode, responseBody);
                return CalendarOperationResult.Failed($"Delete event failed: {response.StatusCode}");
            }

            return CalendarOperationResult.Succeeded();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting Apple calendar event");
            return CalendarOperationResult.Failed(ex.Message);
        }
    }

    public Task<string?> GetUserEmailAsync(string accessToken, CancellationToken cancellationToken = default)
    {
        try
        {
            var (appleId, _) = DecodeCredentials(accessToken);
            return Task.FromResult<string?>(appleId);
        }
        catch
        {
            return Task.FromResult<string?>(null);
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
            var (appleId, appPassword) = DecodeCredentials(accessToken);
            var calendar = calendarId ?? await GetDefaultCalendarPathAsync(appleId, appPassword, cancellationToken);

            if (string.IsNullOrEmpty(calendar))
            {
                return BusyTimesResult.Failed("Could not determine calendar path");
            }

            // CalDAV REPORT request for time-range query
            var reportXml = $@"<?xml version=""1.0"" encoding=""utf-8""?>
<c:calendar-query xmlns:d=""DAV:"" xmlns:c=""urn:ietf:params:xml:ns:caldav"">
  <d:prop>
    <d:getetag/>
    <c:calendar-data/>
  </d:prop>
  <c:filter>
    <c:comp-filter name=""VCALENDAR"">
      <c:comp-filter name=""VEVENT"">
        <c:time-range start=""{startTime.ToUniversalTime():yyyyMMddTHHmmssZ}"" end=""{endTime.ToUniversalTime():yyyyMMddTHHmmssZ}""/>
      </c:comp-filter>
    </c:comp-filter>
  </c:filter>
</c:calendar-query>";

            var request = new HttpRequestMessage(new HttpMethod("REPORT"), $"{CalDavBase}{calendar}");
            SetBasicAuth(request, appleId, appPassword);
            request.Content = new StringContent(reportXml, Encoding.UTF8, "application/xml");
            request.Headers.Add("Depth", "1");

            var response = await _httpClient.SendAsync(request, cancellationToken);
            var responseBody = await response.Content.ReadAsStringAsync(cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError("Apple CalDAV REPORT failed: {Status} - {Response}", response.StatusCode, responseBody);
                return BusyTimesResult.Failed($"Calendar query failed: {response.StatusCode}");
            }

            // Parse the CalDAV response and extract busy times
            var busySlots = ParseCalDavResponse(responseBody);

            _logger.LogInformation(
                "Retrieved {Count} busy slots from Apple Calendar for range {Start} to {End}",
                busySlots.Count, startTime, endTime);

            return BusyTimesResult.Succeeded(busySlots);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting busy times from Apple Calendar");
            return BusyTimesResult.Failed(ex.Message);
        }
    }

    private async Task<bool> VerifyCredentialsAsync(string appleId, string appPassword, CancellationToken cancellationToken)
    {
        try
        {
            // Try to access the principal URL to verify credentials
            var request = new HttpRequestMessage(new HttpMethod("PROPFIND"), $"{CalDavBase}/");
            SetBasicAuth(request, appleId, appPassword);
            request.Headers.Add("Depth", "0");
            request.Content = new StringContent(
                @"<?xml version=""1.0"" encoding=""utf-8""?><d:propfind xmlns:d=""DAV:""><d:prop><d:current-user-principal/></d:prop></d:propfind>",
                Encoding.UTF8,
                "application/xml");

            var response = await _httpClient.SendAsync(request, cancellationToken);
            return response.IsSuccessStatusCode;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to verify Apple CalDAV credentials");
            return false;
        }
    }

    private async Task<string?> GetDefaultCalendarPathAsync(string appleId, string appPassword, CancellationToken cancellationToken)
    {
        try
        {
            _logger.LogInformation("[AppleCalDAV] Starting calendar path discovery for {AppleId}", appleId);

            // First, get the principal URL
            var propfindXml = @"<?xml version=""1.0"" encoding=""utf-8""?>
<d:propfind xmlns:d=""DAV:"">
  <d:prop>
    <d:current-user-principal/>
  </d:prop>
</d:propfind>";

            var request = new HttpRequestMessage(new HttpMethod("PROPFIND"), $"{CalDavBase}/");
            SetBasicAuth(request, appleId, appPassword);
            request.Headers.Add("Depth", "0");
            request.Content = new StringContent(propfindXml, Encoding.UTF8, "application/xml");

            var response = await _httpClient.SendAsync(request, cancellationToken);
            var responseBody = await response.Content.ReadAsStringAsync(cancellationToken);

            _logger.LogDebug("[AppleCalDAV] PROPFIND response: {Status}, Body: {Body}", response.StatusCode, responseBody);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("[AppleCalDAV] Failed to get principal URL: {Status}", response.StatusCode);
                return null;
            }

            // Parse principal URL from response
            var principalUrl = ParsePrincipalUrl(responseBody);
            if (string.IsNullOrEmpty(principalUrl))
            {
                _logger.LogWarning("[AppleCalDAV] Could not find principal URL in response. Response: {Response}", responseBody);
                return null;
            }

            _logger.LogInformation("[AppleCalDAV] Found principal URL: {PrincipalUrl}", principalUrl);

            // Get calendar home
            var homeRequest = new HttpRequestMessage(new HttpMethod("PROPFIND"), $"{CalDavBase}{principalUrl}");
            SetBasicAuth(homeRequest, appleId, appPassword);
            homeRequest.Headers.Add("Depth", "0");
            homeRequest.Content = new StringContent(
                @"<?xml version=""1.0"" encoding=""utf-8""?><d:propfind xmlns:d=""DAV:"" xmlns:c=""urn:ietf:params:xml:ns:caldav""><d:prop><c:calendar-home-set/></d:prop></d:propfind>",
                Encoding.UTF8,
                "application/xml");

            var homeResponse = await _httpClient.SendAsync(homeRequest, cancellationToken);
            var homeBody = await homeResponse.Content.ReadAsStringAsync(cancellationToken);

            _logger.LogDebug("[AppleCalDAV] Calendar home response: {Status}, Body: {Body}", homeResponse.StatusCode, homeBody);

            if (!homeResponse.IsSuccessStatusCode)
            {
                _logger.LogWarning("[AppleCalDAV] Failed to get calendar home: {Status}", homeResponse.StatusCode);
                return null;
            }

            var calendarHome = ParseCalendarHome(homeBody);
            if (string.IsNullOrEmpty(calendarHome))
            {
                _logger.LogWarning("[AppleCalDAV] Could not parse calendar home from response. Response: {Response}", homeBody);
                return null;
            }

            _logger.LogInformation("[AppleCalDAV] Found calendar home: {CalendarHome}", calendarHome);

            // Apple may return a full URL (https://p136-caldav.icloud.com/...) or a relative path
            // If it's a full URL, use it directly; otherwise prepend CalDavBase
            var calendarHomeUrl = calendarHome.StartsWith("http", StringComparison.OrdinalIgnoreCase)
                ? calendarHome
                : $"{CalDavBase}{calendarHome}";

            _logger.LogInformation("[AppleCalDAV] Using calendar home URL: {CalendarHomeUrl}", calendarHomeUrl);

            // Get default calendar from calendar home
            var calendarsRequest = new HttpRequestMessage(new HttpMethod("PROPFIND"), calendarHomeUrl);
            SetBasicAuth(calendarsRequest, appleId, appPassword);
            calendarsRequest.Headers.Add("Depth", "1");
            calendarsRequest.Content = new StringContent(
                @"<?xml version=""1.0"" encoding=""utf-8""?><d:propfind xmlns:d=""DAV:"" xmlns:c=""urn:ietf:params:xml:ns:caldav""><d:prop><d:resourcetype/><d:displayname/></d:prop></d:propfind>",
                Encoding.UTF8,
                "application/xml");

            var calendarsResponse = await _httpClient.SendAsync(calendarsRequest, cancellationToken);
            var calendarsBody = await calendarsResponse.Content.ReadAsStringAsync(cancellationToken);

            _logger.LogDebug("[AppleCalDAV] Calendars list response: {Status}, Body: {Body}", calendarsResponse.StatusCode, calendarsBody);

            var defaultCalendar = ParseDefaultCalendar(calendarsBody);

            if (!string.IsNullOrEmpty(defaultCalendar))
            {
                _logger.LogInformation("[AppleCalDAV] Found default calendar: {DefaultCalendar}", defaultCalendar);
                return defaultCalendar;
            }

            // If no specific calendar found, use calendar home as fallback
            _logger.LogInformation("[AppleCalDAV] No specific calendar found, using calendar home: {CalendarHome}", calendarHome);
            return calendarHome;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[AppleCalDAV] Error getting default calendar path");
            return null;
        }
    }

    private static (string appleId, string appPassword) DecodeCredentials(string accessToken)
    {
        var decoded = Encoding.UTF8.GetString(Convert.FromBase64String(accessToken));
        var parts = decoded.Split(':');
        if (parts.Length != 2)
        {
            throw new InvalidOperationException("Invalid credentials format");
        }
        return (parts[0], parts[1]);
    }

    private static void SetBasicAuth(HttpRequestMessage request, string username, string password)
    {
        var credentials = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{username}:{password}"));
        request.Headers.Authorization = new AuthenticationHeaderValue("Basic", credentials);
    }

    private static string CreateICalEvent(CalendarAppointment appointment, string uid)
    {
        var dtStart = appointment.StartTime.ToUniversalTime().ToString("yyyyMMddTHHmmssZ");
        var dtEnd = appointment.EndTime.ToUniversalTime().ToString("yyyyMMddTHHmmssZ");
        var dtstamp = DateTime.UtcNow.ToString("yyyyMMddTHHmmssZ");

        var sb = new StringBuilder();
        sb.AppendLine("BEGIN:VCALENDAR");
        sb.AppendLine("VERSION:2.0");
        sb.AppendLine("PRODID:-//SkillSwap//Calendar//EN");
        sb.AppendLine("BEGIN:VEVENT");
        sb.AppendLine($"UID:{uid}");
        sb.AppendLine($"DTSTAMP:{dtstamp}");
        sb.AppendLine($"DTSTART:{dtStart}");
        sb.AppendLine($"DTEND:{dtEnd}");
        sb.AppendLine($"SUMMARY:{EscapeICalText(appointment.Title)}");

        if (!string.IsNullOrEmpty(appointment.Description))
        {
            sb.AppendLine($"DESCRIPTION:{EscapeICalText(appointment.Description)}");
        }

        if (!string.IsNullOrEmpty(appointment.Location))
        {
            sb.AppendLine($"LOCATION:{EscapeICalText(appointment.Location)}");
        }

        if (!string.IsNullOrEmpty(appointment.MeetingLink))
        {
            sb.AppendLine($"URL:{appointment.MeetingLink}");
        }

        foreach (var attendee in appointment.Attendees)
        {
            sb.AppendLine($"ATTENDEE:mailto:{attendee}");
        }

        sb.AppendLine("END:VEVENT");
        sb.AppendLine("END:VCALENDAR");

        return sb.ToString();
    }

    private static string EscapeICalText(string text)
    {
        return text
            .Replace("\\", "\\\\")
            .Replace(";", "\\;")
            .Replace(",", "\\,")
            .Replace("\n", "\\n")
            .Replace("\r", "");
    }

    private List<CalendarBusySlot> ParseCalDavResponse(string xmlResponse)
    {
        var busySlots = new List<CalendarBusySlot>();

        try
        {
            var doc = XDocument.Parse(xmlResponse);
            var calendarDataElements = doc.Descendants(CalDavNs + "calendar-data");

            foreach (var calData in calendarDataElements)
            {
                var icalContent = calData.Value;
                if (string.IsNullOrEmpty(icalContent)) continue;

                var events = ParseICalEvents(icalContent);
                busySlots.AddRange(events);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error parsing CalDAV response");
        }

        return busySlots;
    }

    private static List<CalendarBusySlot> ParseICalEvents(string icalContent)
    {
        var events = new List<CalendarBusySlot>();

        // Simple regex-based parsing for VEVENT
        var eventMatches = VEventRegex().Matches(icalContent);

        foreach (Match eventMatch in eventMatches)
        {
            var eventContent = eventMatch.Groups[1].Value;

            var dtStartMatch = DtStartRegex().Match(eventContent);
            var dtEndMatch = DtEndRegex().Match(eventContent);
            var summaryMatch = SummaryRegex().Match(eventContent);

            if (dtStartMatch.Success && dtEndMatch.Success)
            {
                var startTime = ParseICalDateTime(dtStartMatch.Groups[1].Value);
                var endTime = ParseICalDateTime(dtEndMatch.Groups[1].Value);

                if (startTime.HasValue && endTime.HasValue)
                {
                    events.Add(new CalendarBusySlot
                    {
                        Start = startTime.Value,
                        End = endTime.Value,
                        Title = summaryMatch.Success ? UnescapeICalText(summaryMatch.Groups[1].Value) : null
                    });
                }
            }
        }

        return events;
    }

    private static DateTime? ParseICalDateTime(string dtString)
    {
        // Handle formats: 20240115T100000Z, 20240115T100000, 20240115
        dtString = dtString.Trim();

        if (DateTime.TryParseExact(dtString, "yyyyMMddTHHmmssZ",
            System.Globalization.CultureInfo.InvariantCulture,
            System.Globalization.DateTimeStyles.AssumeUniversal, out var dt1))
        {
            return dt1.ToUniversalTime();
        }

        if (DateTime.TryParseExact(dtString, "yyyyMMddTHHmmss",
            System.Globalization.CultureInfo.InvariantCulture,
            System.Globalization.DateTimeStyles.None, out var dt2))
        {
            return dt2;
        }

        if (DateTime.TryParseExact(dtString, "yyyyMMdd",
            System.Globalization.CultureInfo.InvariantCulture,
            System.Globalization.DateTimeStyles.None, out var dt3))
        {
            return dt3;
        }

        return null;
    }

    private static string UnescapeICalText(string text)
    {
        return text
            .Replace("\\n", "\n")
            .Replace("\\,", ",")
            .Replace("\\;", ";")
            .Replace("\\\\", "\\");
    }

    private static string? ParsePrincipalUrl(string xmlResponse)
    {
        try
        {
            var doc = XDocument.Parse(xmlResponse);
            var href = doc.Descendants(DavNs + "current-user-principal")
                .SelectMany(e => e.Descendants(DavNs + "href"))
                .FirstOrDefault();
            return href?.Value;
        }
        catch
        {
            return null;
        }
    }

    private static string? ParseCalendarHome(string xmlResponse)
    {
        try
        {
            var doc = XDocument.Parse(xmlResponse);
            var href = doc.Descendants(CalDavNs + "calendar-home-set")
                .SelectMany(e => e.Descendants(DavNs + "href"))
                .FirstOrDefault();
            return href?.Value;
        }
        catch
        {
            return null;
        }
    }

    private static string? ParseDefaultCalendar(string xmlResponse)
    {
        try
        {
            var doc = XDocument.Parse(xmlResponse);
            // Find the first response that has a calendar resourcetype
            var responses = doc.Descendants(DavNs + "response");

            foreach (var response in responses)
            {
                var resourceType = response.Descendants(DavNs + "resourcetype").FirstOrDefault();
                if (resourceType?.Descendants(CalDavNs + "calendar").Any() == true)
                {
                    var href = response.Descendants(DavNs + "href").FirstOrDefault();
                    if (href != null)
                    {
                        return href.Value;
                    }
                }
            }
            return null;
        }
        catch
        {
            return null;
        }
    }

    // Compiled regex patterns for iCal parsing
    [GeneratedRegex(@"BEGIN:VEVENT(.*?)END:VEVENT", RegexOptions.Singleline)]
    private static partial Regex VEventRegex();

    [GeneratedRegex(@"DTSTART[^:]*:(\d{8}T?\d{0,6}Z?)", RegexOptions.None)]
    private static partial Regex DtStartRegex();

    [GeneratedRegex(@"DTEND[^:]*:(\d{8}T?\d{0,6}Z?)", RegexOptions.None)]
    private static partial Regex DtEndRegex();

    [GeneratedRegex(@"SUMMARY:(.+?)(?:\r?\n(?![ \t])|\r?\n$)", RegexOptions.Singleline)]
    private static partial Regex SummaryRegex();
}
