using System.ComponentModel.DataAnnotations;

namespace Contracts.Appointment.Requests;

/// <summary>
/// Request to report a problematic appointment
/// </summary>
public record ReportAppointmentRequest
{
    /// <summary>
    /// Reason for the report (e.g., "no-show", "inappropriate-behavior", "spam")
    /// </summary>
    [Required(ErrorMessage = "Reason is required")]
    [StringLength(100, ErrorMessage = "Reason cannot exceed 100 characters")]
    public string Reason { get; init; } = string.Empty;

    /// <summary>
    /// Additional details about the issue
    /// </summary>
    [StringLength(2000, ErrorMessage = "Details cannot exceed 2000 characters")]
    public string? Details { get; init; }
}
