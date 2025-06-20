using CQRS.Interfaces;

namespace AppointmentService.Application.Commands;

public record RescheduleAppointmentCommand(
    string AppointmentId,
    DateTime NewScheduledDate,
    string? Reason = null) : ICommand<RescheduleAppointmentResponse>, IAuditableCommand
{
    public string? UserId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

public record RescheduleAppointmentResponse(
    string AppointmentId,
    DateTime NewScheduledDate,
    DateTime UpdatedAt);