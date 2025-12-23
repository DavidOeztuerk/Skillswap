using CQRS.Interfaces;

namespace Events.Domain.Appointment;

/// <summary>
/// Domain event published when a reschedule request is approved and the session is rescheduled
/// </summary>
public record SessionRescheduledEvent(
    string SessionAppointmentId,
    DateTime OldDate,
    DateTime NewDate,
    string ApprovedByUserId) : DomainEvent;
