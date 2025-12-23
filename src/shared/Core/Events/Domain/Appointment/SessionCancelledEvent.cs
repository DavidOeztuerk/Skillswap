using CQRS.Interfaces;

namespace Events.Domain.Appointment;

/// <summary>
/// Domain event published when a SessionAppointment is cancelled
/// </summary>
public record SessionCancelledEvent(
    string SessionAppointmentId,
    string SessionSeriesId,
    string CancelledByUserId,
    string? Reason,
    bool IsLateCancellation) : DomainEvent;
