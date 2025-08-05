using Contracts.Appointment.Responses;
using CQRS.Interfaces;

namespace AppointmentService.Application.Commands;

public record CancelAppointmentCommand(
    string AppointmentId,
    string? Reason = null) 
    : ICommand<CancelAppointmentResponse>, IAuditableCommand
{
    public string? UserId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}