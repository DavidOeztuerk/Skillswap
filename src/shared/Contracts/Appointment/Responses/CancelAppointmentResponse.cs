using Contracts.Common;

namespace Contracts.Appointment.Responses;

/// <summary>
/// API response for CancelAppointment operation
/// </summary>
/// <param name="AppointmentId">Unique identifier for the cancelled appointment</param>
/// <param name="Success">Indicates whether the cancellation was successful</param>
/// <param name="CancelledAt">Date and time when the appointment was cancelled</param>
public record CancelAppointmentResponse(
    string AppointmentId,
    bool Success,
    DateTime CancelledAt)
    : IVersionedContract
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}
