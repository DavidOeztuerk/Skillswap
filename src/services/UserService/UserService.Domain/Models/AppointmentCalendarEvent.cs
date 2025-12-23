using Domain.Abstractions;
using System.ComponentModel.DataAnnotations;

namespace UserService.Domain.Models;

/// <summary>
/// Stores the mapping between internal appointments and external calendar events
/// Each appointment can have multiple calendar events (one for each connected calendar provider)
/// </summary>
public class AppointmentCalendarEvent : AuditableEntity
{
    /// <summary>
    /// The internal appointment ID (from AppointmentService)
    /// </summary>
    [Required]
    [MaxLength(450)]
    public string AppointmentId { get; set; } = string.Empty;

    /// <summary>
    /// The user ID who owns this calendar event
    /// </summary>
    [Required]
    [MaxLength(450)]
    public string UserId { get; set; } = string.Empty;

    /// <summary>
    /// The calendar provider (Google, Microsoft, Apple)
    /// </summary>
    [Required]
    [MaxLength(50)]
    public string Provider { get; set; } = string.Empty;

    /// <summary>
    /// The external event ID from the calendar provider
    /// </summary>
    [Required]
    [MaxLength(1000)]
    public string ExternalEventId { get; set; } = string.Empty;

    /// <summary>
    /// The calendar ID where the event was created (e.g., 'primary')
    /// </summary>
    [MaxLength(450)]
    public string? CalendarId { get; set; }

    /// <summary>
    /// When the event was synced to the external calendar
    /// </summary>
    public DateTime SyncedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// When the event was last updated in the external calendar
    /// </summary>
    public DateTime? LastUpdatedAt { get; set; }

    /// <summary>
    /// Status of the sync (Created, Updated, Deleted, Failed)
    /// </summary>
    [MaxLength(50)]
    public string Status { get; set; } = CalendarEventStatus.Created;

    /// <summary>
    /// Error message if sync failed
    /// </summary>
    [MaxLength(1000)]
    public string? ErrorMessage { get; set; }

    // Navigation properties
    public virtual User? User { get; set; }
    public virtual UserCalendarConnection? CalendarConnection { get; set; }
}

/// <summary>
/// Status values for calendar event sync
/// </summary>
public static class CalendarEventStatus
{
    public const string Created = "Created";
    public const string Updated = "Updated";
    public const string Deleted = "Deleted";
    public const string Failed = "Failed";
}
