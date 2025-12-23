using CQRS.Models;
using MediatR;
using Microsoft.Extensions.Logging;
using UserService.Application.Commands.Calendar;
using UserService.Domain.Models;
using UserService.Domain.Repositories;
using UserService.Domain.Services;

namespace UserService.Application.CommandHandlers.Calendar;

/// <summary>
/// Handles syncing appointments to external calendars
/// </summary>
public class SyncAppointmentToCalendarCommandHandler(
    IUserCalendarConnectionRepository calendarConnectionRepository,
    IAppointmentCalendarEventRepository calendarEventRepository,
    ICalendarServiceFactory calendarServiceFactory,
    ITokenEncryptionService tokenEncryptionService,
    ILogger<SyncAppointmentToCalendarCommandHandler> logger)
    : IRequestHandler<SyncAppointmentToCalendarCommand, ApiResponse<CalendarSyncResult>>,
      IRequestHandler<UpdateCalendarAppointmentCommand, ApiResponse<CalendarSyncResult>>,
      IRequestHandler<DeleteCalendarAppointmentCommand, ApiResponse<CalendarSyncResult>>
{
    private readonly IUserCalendarConnectionRepository _calendarConnectionRepository = calendarConnectionRepository;
    private readonly IAppointmentCalendarEventRepository _calendarEventRepository = calendarEventRepository;
    private readonly ICalendarServiceFactory _calendarServiceFactory = calendarServiceFactory;
    private readonly ITokenEncryptionService _tokenEncryptionService = tokenEncryptionService;
    private readonly ILogger<SyncAppointmentToCalendarCommandHandler> _logger = logger;

    public async Task<ApiResponse<CalendarSyncResult>> Handle(
        SyncAppointmentToCalendarCommand request,
        CancellationToken cancellationToken)
    {
        try
        {
            _logger.LogInformation(
                "Syncing appointment {AppointmentId} to calendars for user {UserId}",
                request.AppointmentId, request.UserId);

            // Get all connected calendars for the user
            var connections = await _calendarConnectionRepository.GetByUserIdAsync(
                request.UserId, cancellationToken);

            if (connections.Count == 0)
            {
                _logger.LogDebug("User {UserId} has no connected calendars", request.UserId);
                return ApiResponse<CalendarSyncResult>.SuccessResult(new CalendarSyncResult
                {
                    Success = true,
                    SyncedCount = 0,
                    FailedCount = 0,
                    Details = []
                });
            }

            var appointment = new CalendarAppointment
            {
                Id = request.AppointmentId,
                Title = request.Title,
                Description = request.Description,
                StartTime = request.StartTime,
                EndTime = request.EndTime,
                Location = request.Location,
                MeetingLink = request.MeetingLink,
                Attendees = request.AttendeeEmails
            };

            var details = new List<CalendarSyncDetail>();
            var syncedCount = 0;
            var failedCount = 0;

            foreach (var connection in connections.Where(c => c.SyncEnabled))
            {
                var result = await SyncToProviderAsync(
                    connection,
                    appointment,
                    request.AppointmentId,
                    cancellationToken);

                details.Add(result);
                if (result.Success) syncedCount++;
                else failedCount++;
            }

            _logger.LogInformation(
                "Synced appointment {AppointmentId} to {Synced} calendars, {Failed} failed",
                request.AppointmentId, syncedCount, failedCount);

            return ApiResponse<CalendarSyncResult>.SuccessResult(new CalendarSyncResult
            {
                Success = syncedCount > 0 || failedCount == 0,
                SyncedCount = syncedCount,
                FailedCount = failedCount,
                Details = details
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error syncing appointment {AppointmentId}", request.AppointmentId);
            return ApiResponse<CalendarSyncResult>.ErrorResult($"Failed to sync calendar: {ex.Message}");
        }
    }

    public async Task<ApiResponse<CalendarSyncResult>> Handle(
        UpdateCalendarAppointmentCommand request,
        CancellationToken cancellationToken)
    {
        try
        {
            _logger.LogInformation(
                "Updating appointment {AppointmentId} in calendars for user {UserId}",
                request.AppointmentId, request.UserId);

            // Get existing calendar events for this appointment
            var existingEvents = await _calendarEventRepository.GetByAppointmentIdAsync(
                request.AppointmentId, cancellationToken);

            var userEvents = existingEvents.Where(e => e.UserId == request.UserId).ToList();

            if (userEvents.Count == 0)
            {
                _logger.LogDebug(
                    "No existing calendar events for appointment {AppointmentId} and user {UserId}",
                    request.AppointmentId, request.UserId);
                return ApiResponse<CalendarSyncResult>.SuccessResult(new CalendarSyncResult
                {
                    Success = true,
                    SyncedCount = 0,
                    FailedCount = 0,
                    Details = []
                });
            }

            var appointment = new CalendarAppointment
            {
                Id = request.AppointmentId,
                Title = request.Title,
                Description = request.Description,
                StartTime = request.StartTime,
                EndTime = request.EndTime,
                Location = request.Location,
                MeetingLink = request.MeetingLink,
                Attendees = request.AttendeeEmails
            };

            var details = new List<CalendarSyncDetail>();
            var syncedCount = 0;
            var failedCount = 0;

            foreach (var calendarEvent in userEvents)
            {
                var result = await UpdateInProviderAsync(
                    calendarEvent,
                    appointment,
                    cancellationToken);

                details.Add(result);
                if (result.Success) syncedCount++;
                else failedCount++;
            }

            return ApiResponse<CalendarSyncResult>.SuccessResult(new CalendarSyncResult
            {
                Success = syncedCount > 0 || failedCount == 0,
                SyncedCount = syncedCount,
                FailedCount = failedCount,
                Details = details
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating appointment {AppointmentId}", request.AppointmentId);
            return ApiResponse<CalendarSyncResult>.ErrorResult($"Failed to update calendar: {ex.Message}");
        }
    }

    public async Task<ApiResponse<CalendarSyncResult>> Handle(
        DeleteCalendarAppointmentCommand request,
        CancellationToken cancellationToken)
    {
        try
        {
            _logger.LogInformation(
                "Deleting appointment {AppointmentId} from calendars for user {UserId}",
                request.AppointmentId, request.UserId);

            // Get existing calendar events for this appointment
            var existingEvents = await _calendarEventRepository.GetByAppointmentIdAsync(
                request.AppointmentId, cancellationToken);

            var userEvents = existingEvents.Where(e => e.UserId == request.UserId).ToList();

            if (userEvents.Count == 0)
            {
                _logger.LogDebug(
                    "No existing calendar events for appointment {AppointmentId} and user {UserId}",
                    request.AppointmentId, request.UserId);
                return ApiResponse<CalendarSyncResult>.SuccessResult(new CalendarSyncResult
                {
                    Success = true,
                    SyncedCount = 0,
                    FailedCount = 0,
                    Details = []
                });
            }

            var details = new List<CalendarSyncDetail>();
            var syncedCount = 0;
            var failedCount = 0;

            foreach (var calendarEvent in userEvents)
            {
                var result = await DeleteFromProviderAsync(calendarEvent, cancellationToken);

                details.Add(result);
                if (result.Success) syncedCount++;
                else failedCount++;
            }

            return ApiResponse<CalendarSyncResult>.SuccessResult(new CalendarSyncResult
            {
                Success = syncedCount > 0 || failedCount == 0,
                SyncedCount = syncedCount,
                FailedCount = failedCount,
                Details = details
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting appointment {AppointmentId}", request.AppointmentId);
            return ApiResponse<CalendarSyncResult>.ErrorResult($"Failed to delete from calendar: {ex.Message}");
        }
    }

    private async Task<CalendarSyncDetail> SyncToProviderAsync(
        UserCalendarConnection connection,
        CalendarAppointment appointment,
        string appointmentId,
        CancellationToken cancellationToken)
    {
        try
        {
            var calendarService = _calendarServiceFactory.GetService(connection.Provider);
            var accessToken = await GetValidAccessTokenAsync(connection, calendarService, cancellationToken);

            if (accessToken == null)
            {
                return new CalendarSyncDetail
                {
                    Provider = connection.Provider,
                    Success = false,
                    Error = "Failed to get valid access token"
                };
            }

            var result = await calendarService.CreateEventAsync(
                accessToken,
                appointment,
                connection.CalendarId,
                cancellationToken);

            if (result.Success)
            {
                // Store the mapping
                var calendarEvent = new AppointmentCalendarEvent
                {
                    AppointmentId = appointmentId,
                    UserId = connection.UserId,
                    Provider = connection.Provider,
                    ExternalEventId = result.ExternalEventId ?? "",
                    CalendarId = connection.CalendarId,
                    SyncedAt = DateTime.UtcNow,
                    Status = CalendarEventStatus.Created
                };

                await _calendarEventRepository.AddAsync(calendarEvent, cancellationToken);
                await _calendarEventRepository.SaveChangesAsync(cancellationToken);

                connection.MarkSyncSuccess();
                await _calendarConnectionRepository.UpdateAsync(connection, cancellationToken);

                return new CalendarSyncDetail
                {
                    Provider = connection.Provider,
                    Success = true,
                    ExternalEventId = result.ExternalEventId
                };
            }

            return new CalendarSyncDetail
            {
                Provider = connection.Provider,
                Success = false,
                Error = result.Error
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error syncing to {Provider} calendar", connection.Provider);
            return new CalendarSyncDetail
            {
                Provider = connection.Provider,
                Success = false,
                Error = ex.Message
            };
        }
    }

    private async Task<CalendarSyncDetail> UpdateInProviderAsync(
        AppointmentCalendarEvent calendarEvent,
        CalendarAppointment appointment,
        CancellationToken cancellationToken)
    {
        try
        {
            var connection = await _calendarConnectionRepository.GetByUserAndProviderAsync(
                calendarEvent.UserId, calendarEvent.Provider, cancellationToken);

            if (connection == null)
            {
                return new CalendarSyncDetail
                {
                    Provider = calendarEvent.Provider,
                    Success = false,
                    Error = "Calendar connection no longer exists"
                };
            }

            var calendarService = _calendarServiceFactory.GetService(calendarEvent.Provider);
            var accessToken = await GetValidAccessTokenAsync(connection, calendarService, cancellationToken);

            if (accessToken == null)
            {
                return new CalendarSyncDetail
                {
                    Provider = calendarEvent.Provider,
                    Success = false,
                    Error = "Failed to get valid access token"
                };
            }

            var result = await calendarService.UpdateEventAsync(
                accessToken,
                calendarEvent.ExternalEventId,
                appointment,
                calendarEvent.CalendarId,
                cancellationToken);

            if (result.Success)
            {
                calendarEvent.LastUpdatedAt = DateTime.UtcNow;
                calendarEvent.Status = CalendarEventStatus.Updated;
                await _calendarEventRepository.UpdateAsync(calendarEvent, cancellationToken);
                await _calendarEventRepository.SaveChangesAsync(cancellationToken);

                return new CalendarSyncDetail
                {
                    Provider = calendarEvent.Provider,
                    Success = true,
                    ExternalEventId = calendarEvent.ExternalEventId
                };
            }

            return new CalendarSyncDetail
            {
                Provider = calendarEvent.Provider,
                Success = false,
                Error = result.Error
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating in {Provider} calendar", calendarEvent.Provider);
            return new CalendarSyncDetail
            {
                Provider = calendarEvent.Provider,
                Success = false,
                Error = ex.Message
            };
        }
    }

    private async Task<CalendarSyncDetail> DeleteFromProviderAsync(
        AppointmentCalendarEvent calendarEvent,
        CancellationToken cancellationToken)
    {
        try
        {
            var connection = await _calendarConnectionRepository.GetByUserAndProviderAsync(
                calendarEvent.UserId, calendarEvent.Provider, cancellationToken);

            if (connection == null)
            {
                // No connection - just mark as deleted in our system
                calendarEvent.Status = CalendarEventStatus.Deleted;
                await _calendarEventRepository.UpdateAsync(calendarEvent, cancellationToken);
                await _calendarEventRepository.SaveChangesAsync(cancellationToken);

                return new CalendarSyncDetail
                {
                    Provider = calendarEvent.Provider,
                    Success = true,
                    ExternalEventId = calendarEvent.ExternalEventId
                };
            }

            var calendarService = _calendarServiceFactory.GetService(calendarEvent.Provider);
            var accessToken = await GetValidAccessTokenAsync(connection, calendarService, cancellationToken);

            if (accessToken == null)
            {
                return new CalendarSyncDetail
                {
                    Provider = calendarEvent.Provider,
                    Success = false,
                    Error = "Failed to get valid access token"
                };
            }

            var result = await calendarService.DeleteEventAsync(
                accessToken,
                calendarEvent.ExternalEventId,
                calendarEvent.CalendarId,
                cancellationToken);

            // Mark as deleted regardless of result (event might already be deleted)
            calendarEvent.Status = CalendarEventStatus.Deleted;
            await _calendarEventRepository.UpdateAsync(calendarEvent, cancellationToken);
            await _calendarEventRepository.SaveChangesAsync(cancellationToken);

            return new CalendarSyncDetail
            {
                Provider = calendarEvent.Provider,
                Success = result.Success,
                ExternalEventId = calendarEvent.ExternalEventId,
                Error = result.Error
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting from {Provider} calendar", calendarEvent.Provider);
            return new CalendarSyncDetail
            {
                Provider = calendarEvent.Provider,
                Success = false,
                Error = ex.Message
            };
        }
    }

    private async Task<string?> GetValidAccessTokenAsync(
        UserCalendarConnection connection,
        ICalendarService calendarService,
        CancellationToken cancellationToken)
    {
        try
        {
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
                        "Failed to refresh token for {Provider}: {Error}",
                        connection.Provider, refreshResult.Error);
                    return null;
                }
            }

            return accessToken;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting valid access token for {Provider}", connection.Provider);
            return null;
        }
    }
}
