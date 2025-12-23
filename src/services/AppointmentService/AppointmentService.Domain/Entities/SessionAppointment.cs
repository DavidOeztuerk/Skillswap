using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Domain.Abstractions;

namespace AppointmentService.Domain.Entities;

/// <summary>
/// Represents a single scheduled session/appointment
/// Part of a SessionSeries, which belongs to a Connection
/// Enhanced with cancellation policies, no-show tracking, and reschedule approval
/// </summary>
public class SessionAppointment : AuditableEntity
{
    /// <summary>
    /// The session series this appointment belongs to
    /// </summary>
    [Required]
    [MaxLength(450)]
    public string SessionSeriesId { get; set; } = string.Empty;

    /// <summary>
    /// Navigation property to SessionSeries
    /// </summary>
    [ForeignKey(nameof(SessionSeriesId))]
    public virtual SessionSeries SessionSeries { get; set; } = null!;

    /// <summary>
    /// Title of this specific session
    /// </summary>
    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    /// <summary>
    /// Description of this session
    /// </summary>
    [MaxLength(2000)]
    public string? Description { get; set; }

    /// <summary>
    /// Scheduled date and time
    /// </summary>
    [Required]
    public DateTime ScheduledDate { get; set; }

    /// <summary>
    /// Duration in minutes
    /// </summary>
    public int DurationMinutes { get; set; } = 60;

    /// <summary>
    /// Session number within the series (1, 2, 3, etc.)
    /// </summary>
    public int SessionNumber { get; set; } = 1;

    /// <summary>
    /// User ID of the organizer/teacher
    /// </summary>
    [Required]
    [MaxLength(450)]
    public string OrganizerUserId { get; set; } = string.Empty;

    /// <summary>
    /// User ID of the participant/learner
    /// </summary>
    [Required]
    [MaxLength(450)]
    public string ParticipantUserId { get; set; } = string.Empty;

    /// <summary>
    /// Current status of the session
    /// </summary>
    [Required]
    [MaxLength(50)]
    public string Status { get; set; } = SessionAppointmentStatus.Pending;

    /// <summary>
    /// Type of meeting (VideoCall, InPerson, Hybrid)
    /// </summary>
    [MaxLength(100)]
    public string? MeetingType { get; set; } = "VideoCall";

    /// <summary>
    /// Meeting link (Jitsi, Zoom, etc.)
    /// </summary>
    [MaxLength(500)]
    public string? MeetingLink { get; set; }

    /// <summary>
    /// Physical location for in-person meetings
    /// </summary>
    [MaxLength(500)]
    public string? MeetingLocation { get; set; }

    /// <summary>
    /// Cancellation reason
    /// </summary>
    [MaxLength(1000)]
    public string? CancellationReason { get; set; }

    /// <summary>
    /// User who cancelled (for tracking cancellation patterns)
    /// </summary>
    [MaxLength(450)]
    public string? CancelledByUserId { get; set; }

    /// <summary>
    /// When cancellation occurred
    /// </summary>
    public DateTime? CancelledAt { get; set; }

    /// <summary>
    /// Whether cancellation was within 24h policy window
    /// </summary>
    public bool IsLateCancellation { get; set; } = false;

    /// <summary>
    /// User who requested reschedule (awaiting approval)
    /// </summary>
    [MaxLength(450)]
    public string? RescheduleRequestedByUserId { get; set; }

    /// <summary>
    /// Proposed new date for reschedule
    /// </summary>
    public DateTime? ProposedRescheduleDate { get; set; }

    /// <summary>
    /// Proposed new duration for reschedule
    /// </summary>
    public int? ProposedRescheduleDuration { get; set; }

    /// <summary>
    /// Reason for reschedule request
    /// </summary>
    [MaxLength(1000)]
    public string? RescheduleReason { get; set; }

    /// <summary>
    /// Whether one or both parties didn't show up
    /// </summary>
    public bool IsNoShow { get; set; } = false;

    /// <summary>
    /// User(s) who didn't show up (comma-separated if both)
    /// </summary>
    [MaxLength(900)]
    public string? NoShowUserIds { get; set; }

    /// <summary>
    /// For payment-based sessions: amount due
    /// </summary>
    public decimal? PaymentAmount { get; set; }

    /// <summary>
    /// Currency for payment
    /// </summary>
    [MaxLength(10)]
    public string? Currency { get; set; }

    /// <summary>
    /// Whether payment has been completed
    /// </summary>
    public bool IsPaymentCompleted { get; set; } = false;

    /// <summary>
    /// When payment was completed
    /// </summary>
    public DateTime? PaymentCompletedAt { get; set; }

    // Reminder tracking
    public bool IsReminder24hSent { get; set; } = false;
    public bool IsReminder1hSent { get; set; } = false;
    public bool IsFollowUpSent { get; set; } = false;
    public DateTime? ReminderSentAt { get; set; }

    // Timestamps
    public DateTime? ConfirmedAt { get; set; }
    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }

    // Helper properties
    public bool IsPending => Status == SessionAppointmentStatus.Pending;
    public bool IsConfirmed => Status == SessionAppointmentStatus.Confirmed;
    public bool IsRescheduleRequested => Status == SessionAppointmentStatus.RescheduleRequested;
    public bool IsInProgress => Status == SessionAppointmentStatus.InProgress;
    public bool IsCompleted => Status == SessionAppointmentStatus.Completed;
    public bool IsCancelled => Status == SessionAppointmentStatus.Cancelled;
    public bool IsWaitingForPayment => Status == SessionAppointmentStatus.WaitingForPayment;
    public bool IsPaymentComplete => Status == SessionAppointmentStatus.PaymentCompleted;
    public bool IsUpcoming => ScheduledDate > DateTime.UtcNow && (IsConfirmed || IsPaymentComplete);
    public bool IsOverdue => ScheduledDate < DateTime.UtcNow && IsPending;
    public bool IsWithin24Hours => (ScheduledDate - DateTime.UtcNow).TotalHours <= 24 && (ScheduledDate - DateTime.UtcNow).TotalHours > 0;

    /// <summary>
    /// Creates a new session appointment
    /// </summary>
    public static SessionAppointment Create(
        string sessionSeriesId,
        string title,
        DateTime scheduledDate,
        int durationMinutes,
        int sessionNumber,
        string organizerUserId,
        string participantUserId,
        string? meetingLink = null,
        string? description = null,
        bool isAutoCreated = false)
    {
        var appointment = new SessionAppointment
        {
            Id = Guid.NewGuid().ToString(),
            SessionSeriesId = sessionSeriesId,
            Title = title,
            Description = description,
            ScheduledDate = scheduledDate,
            DurationMinutes = durationMinutes,
            SessionNumber = sessionNumber,
            OrganizerUserId = organizerUserId,
            ParticipantUserId = participantUserId,
            MeetingLink = meetingLink,
            Status = SessionAppointmentStatus.Pending,
            CreatedAt = DateTime.UtcNow, 
        };

        if (isAutoCreated)
        {
            appointment.Confirm();
        }

        return appointment;
    }

    /// <summary>
    /// Confirm the session
    /// </summary>
    public void Confirm()
    {
        if (IsPending || IsWaitingForPayment)
        {
            Status = SessionAppointmentStatus.Confirmed;
            ConfirmedAt = DateTime.UtcNow;
            UpdatedAt = DateTime.UtcNow;
        }
    }

    /// <summary>
    /// Request reschedule (requires approval from other party)
    /// </summary>
    public void RequestReschedule(string requestedByUserId, DateTime proposedDate, int? proposedDuration, string reason)
    {
        Status = SessionAppointmentStatus.RescheduleRequested;
        RescheduleRequestedByUserId = requestedByUserId;
        ProposedRescheduleDate = proposedDate;
        ProposedRescheduleDuration = proposedDuration;
        RescheduleReason = reason;
        UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Approve reschedule request
    /// </summary>
    public void ApproveReschedule()
    {
        if (IsRescheduleRequested && ProposedRescheduleDate.HasValue)
        {
            ScheduledDate = ProposedRescheduleDate.Value;

            if (ProposedRescheduleDuration.HasValue)
            {
                DurationMinutes = ProposedRescheduleDuration.Value;
            }

            // Reset to pending/confirmed state
            Status = SessionAppointmentStatus.Confirmed;

            // Clear reschedule data
            RescheduleRequestedByUserId = null;
            ProposedRescheduleDate = null;
            ProposedRescheduleDuration = null;
            RescheduleReason = null;

            // Reset reminder flags
            IsReminder24hSent = false;
            IsReminder1hSent = false;

            UpdatedAt = DateTime.UtcNow;
        }
    }

    /// <summary>
    /// Reject reschedule request
    /// </summary>
    public void RejectReschedule()
    {
        if (IsRescheduleRequested)
        {
            Status = SessionAppointmentStatus.Confirmed;

            // Clear reschedule data
            RescheduleRequestedByUserId = null;
            ProposedRescheduleDate = null;
            ProposedRescheduleDuration = null;
            RescheduleReason = null;

            UpdatedAt = DateTime.UtcNow;
        }
    }

    /// <summary>
    /// Start the session
    /// </summary>
    public void Start()
    {
        if (IsConfirmed || IsPaymentComplete)
        {
            Status = SessionAppointmentStatus.InProgress;
            StartedAt = DateTime.UtcNow;
            UpdatedAt = DateTime.UtcNow;
        }
    }

    /// <summary>
    /// Complete the session
    /// </summary>
    public void Complete()
    {
        Status = SessionAppointmentStatus.Completed;
        CompletedAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Cancel the session
    /// </summary>
    public void Cancel(string cancelledByUserId, string? reason = null)
    {
        Status = SessionAppointmentStatus.Cancelled;
        CancelledByUserId = cancelledByUserId;
        CancellationReason = reason;
        CancelledAt = DateTime.UtcNow;

        // Check if cancellation is within 24h window
        IsLateCancellation = IsWithin24Hours;

        UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Mark as no-show
    /// </summary>
    public void MarkAsNoShow(string noShowUserIds)
    {
        Status = SessionAppointmentStatus.NoShow;
        IsNoShow = true;
        NoShowUserIds = noShowUserIds;
        UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Mark payment as waiting
    /// </summary>
    public void SetWaitingForPayment(decimal amount, string currency)
    {
        Status = SessionAppointmentStatus.WaitingForPayment;
        PaymentAmount = amount;
        Currency = currency;
        IsPaymentCompleted = false;
        UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Mark payment as completed
    /// </summary>
    public void CompletePayment()
    {
        Status = SessionAppointmentStatus.PaymentCompleted;
        IsPaymentCompleted = true;
        PaymentCompletedAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Update meeting link
    /// </summary>
    public void UpdateMeetingLink(string meetingLink)
    {
        MeetingLink = meetingLink;
        UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Mark 24h reminder as sent
    /// </summary>
    public void MarkReminder24hSent()
    {
        IsReminder24hSent = true;
        UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Mark 1h reminder as sent
    /// </summary>
    public void MarkReminder1hSent()
    {
        IsReminder1hSent = true;
        UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Mark follow-up as sent
    /// </summary>
    public void MarkFollowUpSent()
    {
        IsFollowUpSent = true;
        UpdatedAt = DateTime.UtcNow;
    }
}
