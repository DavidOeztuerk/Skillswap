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

// ============================================================================
// SESSION LIFECYCLE REQUESTS
// ============================================================================

public record StartSessionRequest;

public record CompleteSessionRequest(
    bool IsNoShow = false,
    string? NoShowReason = null
);

public record RateSessionRequest(
    int Rating,
    string? Feedback = null,
    bool IsPublic = true,
    bool? WouldRecommend = null,
    string? Tags = null
);

public record RescheduleSessionRequest(
    DateTime ProposedDate,
    int? ProposedDurationMinutes = null,
    string? Reason = null
);

public record ProcessSessionPaymentRequest(
    string PayeeId,
    decimal Amount,
    string Currency = "EUR",
    string? PaymentMethodToken = null,
    decimal? PlatformFeePercent = null
);

public record CancelSessionRequest(
    string? Reason = null
);

