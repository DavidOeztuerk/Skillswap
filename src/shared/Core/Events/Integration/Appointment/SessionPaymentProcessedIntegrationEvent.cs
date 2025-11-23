namespace Events.Integration.Appointment;

/// <summary>
/// Integration event published when a SessionAppointment payment is processed
/// Consumed by NotificationService for payment confirmations
/// Consumed by FinanceService/WalletService for payment tracking
/// </summary>
public record SessionPaymentProcessedIntegrationEvent(
    string SessionAppointmentId,
    string PayerId,
    string PayeeId,
    string OrganizerName,
    string ParticipantName,
    decimal Amount,
    string Currency,
    string PaymentStatus,
    string? TransactionId,
    string? ErrorMessage,
    DateTime ProcessedAt,
    DateTime PublishedAt);
