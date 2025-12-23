namespace Contracts.Appointment.Responses;

/// <summary>
/// Response after updating an appointment
/// </summary>
public record UpdateAppointmentResponse(
    string AppointmentId,
    string Title,
    string? Description,
    string? MeetingLink,
    DateTimeOffset UpdatedAt);
