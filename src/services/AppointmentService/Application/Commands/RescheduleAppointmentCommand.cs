using Contracts.Appointment.Responses;
using CQRS.Interfaces;

namespace AppointmentService.Application.Commands;

public record RescheduleAppointmentCommand(
    string AppointmentId,
    DateTimeOffset NewScheduledDate,
    int? NewDurationMinutes = null,
    string? Reason = null) 
    : ICommand<RescheduleAppointmentResponse>, IAuditableCommand
{
    public string? UserId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}
