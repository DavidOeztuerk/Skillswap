namespace Contracts.Appointment.Responses;

/// <summary>
/// Response after reporting an appointment
/// </summary>
public record ReportAppointmentResponse(
    string ReportId,
    string AppointmentId,
    string Status,
    DateTimeOffset ReportedAt,
    string Message);
