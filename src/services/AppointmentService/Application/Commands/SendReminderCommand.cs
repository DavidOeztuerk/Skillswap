using CQRS.Interfaces;

namespace AppointmentService.Application.Commands;

public record SendReminderCommand(
    string AppointmentId,
    int MinutesBefore
) : ICommand<bool>
{
    public string? UserId { get; init; }
}

