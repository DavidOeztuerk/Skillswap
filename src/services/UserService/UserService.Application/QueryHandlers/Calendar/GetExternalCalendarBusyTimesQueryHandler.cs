using CQRS.Models;
using MediatR;
using Microsoft.Extensions.Logging;
using UserService.Application.Queries.Calendar;
using UserService.Domain.Repositories;
using UserService.Domain.Services;

namespace UserService.Application.QueryHandlers.Calendar;

/// <summary>
/// Handler for getting busy times from a user's connected external calendars
/// </summary>
public class GetExternalCalendarBusyTimesQueryHandler(
    IUserCalendarConnectionRepository calendarConnectionRepository,
    ICalendarServiceFactory calendarServiceFactory,
    ITokenEncryptionService tokenEncryptionService,
    ILogger<GetExternalCalendarBusyTimesQueryHandler> logger)
    : IRequestHandler<GetExternalCalendarBusyTimesQuery, ApiResponse<ExternalBusyTimesResponse>>
{
    private readonly IUserCalendarConnectionRepository _calendarConnectionRepository = calendarConnectionRepository;
    private readonly ICalendarServiceFactory _calendarServiceFactory = calendarServiceFactory;
    private readonly ITokenEncryptionService _tokenEncryptionService = tokenEncryptionService;
    private readonly ILogger<GetExternalCalendarBusyTimesQueryHandler> _logger = logger;

    public async Task<ApiResponse<ExternalBusyTimesResponse>> Handle(
        GetExternalCalendarBusyTimesQuery request,
        CancellationToken cancellationToken)
    {
        try
        {
            _logger.LogInformation(
                "Getting external calendar busy times for user {UserId} from {Start} to {End}",
                request.UserId, request.StartTime, request.EndTime);

            // Get all connected calendars for the user
            var connections = await _calendarConnectionRepository.GetByUserIdAsync(
                request.UserId, cancellationToken);

            if (connections.Count == 0)
            {
                _logger.LogDebug("User {UserId} has no connected calendars", request.UserId);
                return ApiResponse<ExternalBusyTimesResponse>.SuccessResult(
                    new ExternalBusyTimesResponse
                    {
                        HasConnectedCalendars = false,
                        ConnectedProviders = [],
                        BusySlots = [],
                        Errors = []
                    });
            }

            var connectedProviders = connections.Select(c => c.Provider).ToList();
            var allBusySlots = new List<BusyTimeSlot>();
            var errors = new List<CalendarError>();

            // NOTE: EF Core DbContext is NOT thread-safe, so we process connections sequentially
            // Token refresh operations (line ~86) update the database, which cannot run in parallel
            var enabledConnections = connections.Where(c => c.SyncEnabled).ToList();
            var results = new List<(string Provider, List<BusyTimeSlot> BusySlots, string? Error)>();

            foreach (var connection in enabledConnections)
            {
                try
                {
                    var calendarService = _calendarServiceFactory.GetService(connection.Provider);

                    // Decrypt access token
                    var accessToken = _tokenEncryptionService.Decrypt(connection.AccessToken);

                    // Check if token needs refresh
                    if (connection.NeedsRefresh() && calendarService.UsesOAuth)
                    {
                        var refreshToken = _tokenEncryptionService.Decrypt(connection.RefreshToken);
                        var refreshResult = await calendarService.RefreshAccessTokenAsync(refreshToken, cancellationToken);

                        if (refreshResult.Success && refreshResult.AccessToken != null)
                        {
                            accessToken = refreshResult.AccessToken;

                            // Update the stored tokens
                            connection.UpdateTokens(
                                _tokenEncryptionService.Encrypt(refreshResult.AccessToken),
                                refreshResult.RefreshToken != null
                                    ? _tokenEncryptionService.Encrypt(refreshResult.RefreshToken)
                                    : connection.RefreshToken,
                                refreshResult.ExpiresAt);

                            await _calendarConnectionRepository.UpdateAsync(connection, cancellationToken);
                        }
                        else
                        {
                            _logger.LogWarning(
                                "Failed to refresh token for {Provider} calendar of user {UserId}: {Error}",
                                connection.Provider, request.UserId, refreshResult.Error);
                            results.Add((connection.Provider, new List<BusyTimeSlot>(),
                                $"Token refresh failed: {refreshResult.Error}"));
                            continue;
                        }
                    }

                    // Get busy times
                    var result = await calendarService.GetBusyTimesAsync(
                        accessToken,
                        request.StartTime,
                        request.EndTime,
                        connection.CalendarId,
                        cancellationToken);

                    if (!result.Success)
                    {
                        results.Add((connection.Provider, new List<BusyTimeSlot>(),
                            result.Error ?? "Unknown error"));
                        continue;
                    }

                    var busySlots = result.BusySlots.Select(slot => new BusyTimeSlot
                    {
                        Start = slot.Start,
                        End = slot.End,
                        Title = slot.Title,
                        Provider = connection.Provider
                    }).ToList();

                    results.Add((connection.Provider, busySlots, null));
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex,
                        "Error fetching busy times from {Provider} calendar for user {UserId}",
                        connection.Provider, request.UserId);
                    results.Add((connection.Provider, new List<BusyTimeSlot>(), ex.Message));
                }
            }

            foreach (var (provider, busySlots, error) in results)
            {
                if (error != null)
                {
                    errors.Add(new CalendarError { Provider = provider, Message = error });
                }
                else
                {
                    allBusySlots.AddRange(busySlots);
                }
            }

            // Sort busy slots by start time
            allBusySlots = allBusySlots.OrderBy(s => s.Start).ToList();

            _logger.LogInformation(
                "Retrieved {Count} busy slots from {ProviderCount} providers for user {UserId}",
                allBusySlots.Count, connectedProviders.Count, request.UserId);

            return ApiResponse<ExternalBusyTimesResponse>.SuccessResult(
                new ExternalBusyTimesResponse
                {
                    HasConnectedCalendars = true,
                    ConnectedProviders = connectedProviders,
                    BusySlots = allBusySlots,
                    Errors = errors
                });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting external calendar busy times for user {UserId}", request.UserId);
            return ApiResponse<ExternalBusyTimesResponse>.ErrorResult($"Failed to get calendar busy times: {ex.Message}");
        }
    }
}
