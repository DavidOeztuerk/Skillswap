using CQRS.Interfaces;

namespace AppointmentService.Application.Commands;

public record CompleteAppointmentCommand(
    string AppointmentId,
    int? SessionDurationMinutes,
    string? Feedback,
    int? Rating
) : ICommand<CompleteAppointmentResponse>, ICacheInvalidatingCommand
{
    public string? UserId { get; init; }

    public string[] InvalidationPatterns => new[]
    {
        "user-appointments:*",
        "appointment-details:*"
    };
}

public record CompleteAppointmentResponse(
    string AppointmentId,
    string Status,
    DateTime CompletedAt
);

