using CQRS.Interfaces;

namespace AppointmentService.Application.Commands;

public record RateAppointmentCommand(
    string AppointmentId,
    int Rating,
    string? Feedback
) : ICommand<bool>
{
    public string? UserId { get; init; }
}

