using CQRS.Interfaces;

namespace Events.Domain.Appointment;

public record AppointmentCancelledDomainEvent(
    string AppointmentId,
    string CancelledByUserId,
    string? Reason,
    DateTime CancelledAt) : DomainEvent;
