using CQRS.Interfaces;

namespace Events.Domain.Appointment;

/// <summary>
/// Domain event published when payment for a SessionAppointment is processed
/// </summary>
public record SessionPaymentProcessedEvent(
    string SessionAppointmentId,
    string PayerId,
    string PayeeId,
    decimal Amount,
    string Currency,
    string PaymentStatus,
    string? TransactionId) : DomainEvent;
