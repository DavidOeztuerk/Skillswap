// TODO: Remove this file after migrating all Appointment logic to SessionAppointment

// using System.ComponentModel.DataAnnotations;
// using Domain.Abstractions;

// namespace AppointmentService.Domain.Entities;

// public class Appointment : AuditableEntity
// {
//     [Required]
//     [MaxLength(200)]
//     public string Title { get; set; } = string.Empty;

//     [MaxLength(2000)]
//     public string? Description { get; set; }

//     [Required]
//     public DateTime ScheduledDate { get; set; }

//     public int DurationMinutes { get; set; } = 60;

//     [Required]
//     [MaxLength(450)]
//     public string OrganizerUserId { get; set; } = string.Empty;

//     [Required]
//     [MaxLength(450)]
//     public string ParticipantUserId { get; set; } = string.Empty;

//     [MaxLength(50)]
//     public string Status { get; set; } = AppointmentStatus.Pending;

//     [MaxLength(500)]
//     public string? CancellationReason { get; set; }

//     [MaxLength(450)]
//     public string? SkillId { get; set; }

//     [MaxLength(450)]
//     public string? MatchId { get; set; }

//     [MaxLength(100)]
//     public string? MeetingType { get; set; } = "VideoCall";

//     [MaxLength(500)]
//     public string? MeetingLink { get; set; }

//     public bool IsReminder1Sent { get; set; } = false;
//     public bool IsReminder2Sent { get; set; } = false;
//     public bool IsFollowUpSent { get; set; } = false;
//     public DateTime? ReminderSentAt { get; set; }

//     public DateTime? AcceptedAt { get; set; }
//     public DateTime? CompletedAt { get; set; }
//     public DateTime? CancelledAt { get; set; }

//     // Skill Exchange Properties
//     public bool IsSkillExchange { get; set; } = false;
//     [MaxLength(450)]
//     public string? ExchangeSkillId { get; set; }

//     // Payment Properties
//     public bool IsMonetary { get; set; } = false;
//     public decimal? Amount { get; set; }
//     [MaxLength(10)]
//     public string? Currency { get; set; }

//     // Session Tracking
//     public int SessionNumber { get; set; } = 1;
//     public int TotalSessions { get; set; } = 1;

//     // Helper properties
//     public bool IsPending => Status == AppointmentStatus.Pending;
//     public bool IsAccepted => Status == AppointmentStatus.Accepted;
//     public bool IsCompleted => Status == AppointmentStatus.Completed;
//     public bool IsCancelled => Status == AppointmentStatus.Cancelled;
//     public bool IsUpcoming => ScheduledDate > DateTime.UtcNow && IsAccepted;
//     public bool IsOverdue => ScheduledDate < DateTime.UtcNow && IsPending;

//     public void Accept()
//     {
//         Status = AppointmentStatus.Accepted;
//         AcceptedAt = DateTime.UtcNow;
//         UpdatedAt = DateTime.UtcNow;
//     }

//     public void Complete()
//     {
//         Status = AppointmentStatus.Completed;
//         CompletedAt = DateTime.UtcNow;
//         UpdatedAt = DateTime.UtcNow;
//     }

//     public void Cancel(string? reason = null)
//     {
//         Status = AppointmentStatus.Cancelled;
//         CancellationReason = reason;
//         CancelledAt = DateTime.UtcNow;
//         UpdatedAt = DateTime.UtcNow;
//     }

//     public void Reschedule(DateTime newScheduledDate, int? newDurationMinutes, string? reason)
//     {
//         ScheduledDate = newScheduledDate;
        
//         if (newDurationMinutes.HasValue)
//         {
//             DurationMinutes = newDurationMinutes.Value;
//         }
        
//         // Store the reason in the description or a separate field if needed
//         if (!string.IsNullOrWhiteSpace(reason))
//         {
//             Description = string.IsNullOrWhiteSpace(Description) 
//                 ? $"Rescheduled: {reason}"
//                 : $"{Description}\n\nRescheduled: {reason}";
//         }
        
//         // Reset reminder flags since the schedule changed
//         IsReminder1Sent = false;
//         IsReminder2Sent = false;
//         ReminderSentAt = null;

//         UpdatedAt = DateTime.UtcNow;
//     }
// }
