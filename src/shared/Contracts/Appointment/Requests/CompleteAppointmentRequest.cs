namespace Contracts.Appointment.Requests;

public record CompleteAppointmentRequest(
    int? SessionDurationMinutes,
    string? Feedback,
    int? Rating
);

public record RateAppointmentRequest(
    int Rating,
    string? Feedback
);

public record SendReminderRequest(
    int MinutesBefore
);

