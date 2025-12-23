using Contracts.Appointment.Responses;
using CQRS.Interfaces;

namespace AppointmentService.Application.Commands;

/// <summary>
/// Command to report a problematic appointment for moderation review
/// </summary>
public record ReportAppointmentCommand(
    string AppointmentId,
    string Reason,
    string? Details = null)
    : ICommand<ReportAppointmentResponse>, IAuditableCommand
{
    public string? UserId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}
