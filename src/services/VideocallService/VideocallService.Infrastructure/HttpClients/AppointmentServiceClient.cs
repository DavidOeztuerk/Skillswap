using Infrastructure.Communication;
using Contracts.Appointment.Responses;
using VideocallService.Domain.Services;
using Microsoft.Extensions.Logging;

namespace VideocallService.Infrastructure.HttpClients;

public class AppointmentServiceClient : IAppointmentServiceClient
{
    private readonly IServiceCommunicationManager _serviceCommunication;
    private readonly ILogger<AppointmentServiceClient> _logger;

    public AppointmentServiceClient(IServiceCommunicationManager serviceCommunication, ILogger<AppointmentServiceClient> logger)
    {
        _serviceCommunication = serviceCommunication;
        _logger = logger;
    }

    public async Task<GetAppointmentDetailsResponse?> GetAppointmentDetailsAsync(string appointmentId, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogDebug("Getting appointment details for {AppointmentId}", appointmentId);

            var response = await _serviceCommunication.GetAsync<GetAppointmentDetailsResponse>(
                "appointmentservice",
                $"api/appointments/{appointmentId}",
                cancellationToken);

            if (response == null)
            {
                _logger.LogWarning("Failed to get appointment details for {AppointmentId} from AppointmentService", appointmentId);
                return null;
            }

            _logger.LogDebug("Successfully retrieved appointment details for {AppointmentId}", appointmentId);
            return response;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching appointment details for {AppointmentId} from AppointmentService", appointmentId);
            return null;
        }
    }

    public async Task<bool> ValidateAppointmentExistsAsync(string appointmentId, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogDebug("Validating appointment existence for {AppointmentId}", appointmentId);

            var response = await GetAppointmentDetailsAsync(appointmentId, cancellationToken);
            var exists = response != null;

            _logger.LogDebug("Appointment {AppointmentId} exists: {Exists}", appointmentId, exists);
            return exists;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating appointment existence for {AppointmentId}", appointmentId);
            return false;
        }
    }

    public async Task<bool> UpdateAppointmentMeetingLinkAsync(string appointmentId, string meetingLink, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogDebug("Updating meeting link for appointment {AppointmentId}", appointmentId);

            var request = new
            {
                MeetingLink = meetingLink,
                UpdatedAt = DateTime.UtcNow
            };

            var response = await _serviceCommunication.SendRequestAsync<object, object>(
                "appointmentservice",
                $"api/appointments/{appointmentId}/meeting-link",
                request,
                cancellationToken);

            var success = response != null;
            _logger.LogDebug("Meeting link update for appointment {AppointmentId}: {Success}", appointmentId, success);
            return success;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating meeting link for appointment {AppointmentId}", appointmentId);
            return false;
        }
    }

    public async Task<List<GetAppointmentDetailsResponse>> GetAppointmentsByUserAsync(string userId, CancellationToken cancellationToken = default)
    {
        var appointments = new List<GetAppointmentDetailsResponse>();

        try
        {
            _logger.LogDebug("Getting appointments for user {UserId}", userId);

            var response = await _serviceCommunication.GetAsync<List<GetAppointmentDetailsResponse>>(
                "appointmentservice",
                "api/my/appointments",
                cancellationToken,
                new Dictionary<string, string> { ["userId"] = userId });

            if (response != null)
            {
                appointments.AddRange(response);
            }

            _logger.LogDebug("Successfully retrieved {AppointmentCount} appointments for user {UserId}",
                appointments.Count, userId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting appointments for user {UserId} from AppointmentService", userId);
        }

        return appointments;
    }
}

