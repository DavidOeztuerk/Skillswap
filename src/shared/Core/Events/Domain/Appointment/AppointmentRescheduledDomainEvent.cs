using CQRS.Interfaces;

namespace Events.Domain.Appointment;

public record AppointmentRescheduledDomainEvent(
    string AppointmentId,
    DateTime OldDate,
    DateTime NewDate,
    string RescheduledByUserId) : DomainEvent;
