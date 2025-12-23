using CQRS.Interfaces;

namespace Events.Domain.Appointment;

/// <summary>
/// Domain event published when a SessionAppointment is rated by a user
/// </summary>
public record SessionRatedEvent(
    string SessionAppointmentId,
    string RaterId,
    string RateeId,
    int Rating,
    string? Feedback,
    bool IsPublic) : DomainEvent;
