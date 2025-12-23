using Contracts.Appointment.Responses;
using CQRS.Interfaces;

namespace AppointmentService.Application.Commands;

public record AcceptAppointmentCommand(
    string AppointmentId) 
    : ICommand<AcceptAppointmentResponse>, IAuditableCommand, ICacheInvalidatingCommand
{
    public string? UserId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    public string[] InvalidationPatterns => new[]
    {
        "user-appointments:*",
        "appointment-details:*"
    };
}
