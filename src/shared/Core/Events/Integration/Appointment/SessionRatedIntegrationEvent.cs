namespace Events.Integration.Appointment;

/// <summary>
/// Integration event published when a SessionAppointment is rated
/// Consumed by UserService to update user ratings/reviews
/// </summary>
public record SessionRatedIntegrationEvent(
    string SessionAppointmentId,
    string RaterId,
    string RateeId,
    int Rating,
    string? Feedback,
    bool IsPublic,
    bool? WouldRecommend,
    DateTime PublishedAt);
