using Contracts.Appointment.Responses;
using CQRS.Interfaces;

namespace AppointmentService.Application.Commands;

/// <summary>
/// Command to update appointment details (title, description, notes)
/// For rescheduling (date/time changes), use RescheduleAppointmentCommand
/// </summary>
public record UpdateAppointmentCommand(
    string AppointmentId,
    string? Title = null,
    string? Description = null,
    string? MeetingLink = null)
    : ICommand<UpdateAppointmentResponse>, IAuditableCommand, ICacheInvalidatingCommand
{
    public string? UserId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    public string[] InvalidationPatterns => new[]
    {
        $"appointment-details:{AppointmentId}",
        "user-appointments:*"
    };
}
