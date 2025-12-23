namespace Contracts.Appointment.Responses;

public record SessionStatusResponse(
    string SessionAppointmentId,
    string Status,
    DateTime? Timestamp,
    string? MeetingLink);
