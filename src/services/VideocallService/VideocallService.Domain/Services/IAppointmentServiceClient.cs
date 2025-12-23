using Contracts.Appointment.Responses;

namespace VideocallService.Domain.Services;

public interface IAppointmentServiceClient
{
    Task<GetAppointmentDetailsResponse?> GetAppointmentDetailsAsync(string appointmentId, CancellationToken cancellationToken = default);
    Task<bool> ValidateAppointmentExistsAsync(string appointmentId, CancellationToken cancellationToken = default);
    Task<bool> UpdateAppointmentMeetingLinkAsync(string appointmentId, string meetingLink, CancellationToken cancellationToken = default);
    Task<List<GetAppointmentDetailsResponse>> GetAppointmentsByUserAsync(string userId, CancellationToken cancellationToken = default);
}
