using System.ComponentModel.DataAnnotations;

namespace Contracts.Appointment.Requests;

/// <summary>
/// Request to update appointment details
/// </summary>
public record UpdateAppointmentRequest
{
    /// <summary>
    /// New title for the appointment (optional)
    /// </summary>
    [StringLength(200, ErrorMessage = "Title cannot exceed 200 characters")]
    public string? Title { get; init; }

    /// <summary>
    /// New description for the appointment (optional)
    /// </summary>
    [StringLength(2000, ErrorMessage = "Description cannot exceed 2000 characters")]
    public string? Description { get; init; }

    /// <summary>
    /// Meeting link (optional, typically auto-generated)
    /// </summary>
    [Url(ErrorMessage = "Meeting link must be a valid URL")]
    public string? MeetingLink { get; init; }
}
