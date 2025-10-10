using CQRS.Interfaces;

namespace AppointmentService.Application.Commands;

public record CompleteAppointmentCommand(
    string AppointmentId,
    int? SessionDurationMinutes,
    string? Feedback,
    int? Rating
) : ICommand<CompleteAppointmentResponse>
{
    public string? UserId { get; init; }
}

public record CompleteAppointmentResponse(
    string AppointmentId,
    string Status,
    DateTime CompletedAt
);

