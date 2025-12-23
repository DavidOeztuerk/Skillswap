namespace Contracts.Appointment.Responses;

public record RatingResponse(
    string RatingId,
    int Rating,
    string? Feedback,
    DateTime CreatedAt);
