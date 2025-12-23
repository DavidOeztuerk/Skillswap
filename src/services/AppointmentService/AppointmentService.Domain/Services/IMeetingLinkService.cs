namespace AppointmentService.Domain.Services;

public interface IMeetingLinkService
{
    Task<string> GenerateMeetingLinkAsync(string appointmentId, CancellationToken cancellationToken = default);
    Task<bool> VerifyMeetingLinkAsync(string appointmentId, string token, CancellationToken cancellationToken = default);
    Task<string> RefreshMeetingLinkAsync(string appointmentId, CancellationToken cancellationToken = default);
    Task<bool> IsMeetingLinkActiveAsync(string appointmentId, CancellationToken cancellationToken = default);
}
