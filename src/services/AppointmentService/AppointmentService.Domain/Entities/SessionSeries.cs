using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Domain.Abstractions;

namespace AppointmentService.Domain.Entities;

/// <summary>
/// Represents a series of related sessions (e.g., "C# Basics - 5 sessions")
/// Acts as a logical grouping of SessionAppointments
/// </summary>
public class SessionSeries : AuditableEntity
{
    /// <summary>
    /// The connection this series belongs to
    /// </summary>
    [Required]
    [MaxLength(450)]
    public string ConnectionId { get; set; } = string.Empty;

    /// <summary>
    /// Navigation property to Connection
    /// </summary>
    [ForeignKey(nameof(ConnectionId))]
    public virtual Connection Connection { get; set; } = null!;

    /// <summary>
    /// Title of the session series (e.g., "C# Fundamentals", "Guitar Lessons Level 1")
    /// </summary>
    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    /// <summary>
    /// Detailed description of what this series covers
    /// </summary>
    [MaxLength(2000)]
    public string? Description { get; set; }

    /// <summary>
    /// Who is teaching in this series
    /// For skill exchange: alternates between users
    /// For payment: the skilled user
    /// </summary>
    [Required]
    [MaxLength(450)]
    public string TeacherUserId { get; set; } = string.Empty;

    /// <summary>
    /// Who is learning in this series
    /// </summary>
    [Required]
    [MaxLength(450)]
    public string LearnerUserId { get; set; } = string.Empty;

    /// <summary>
    /// Skill being taught in this series
    /// </summary>
    [Required]
    [MaxLength(450)]
    public string SkillId { get; set; } = string.Empty;

    /// <summary>
    /// Total number of sessions planned in this series
    /// </summary>
    public int TotalSessions { get; set; } = 1;

    /// <summary>
    /// Number of sessions completed
    /// </summary>
    public int CompletedSessions { get; set; } = 0;

    /// <summary>
    /// Default duration for sessions in this series (minutes)
    /// </summary>
    public int DefaultDurationMinutes { get; set; } = 60;

    /// <summary>
    /// Current status of the series
    /// </summary>
    [Required]
    [MaxLength(50)]
    public string Status { get; set; } = SeriesStatus.Planned;

    /// <summary>
    /// Reason for status change (e.g., cancellation reason)
    /// </summary>
    [MaxLength(1000)]
    public string? StatusReason { get; set; }

    /// <summary>
    /// When the series was created/planned
    /// </summary>
    public DateTime PlannedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// When the first session started
    /// </summary>
    public DateTime? StartedAt { get; set; }

    /// <summary>
    /// When all sessions were completed
    /// </summary>
    public DateTime? CompletedAt { get; set; }

    /// <summary>
    /// All individual session appointments in this series
    /// </summary>
    public virtual ICollection<SessionAppointment> SessionAppointments { get; set; } = new List<SessionAppointment>();

    // Helper properties
    public bool IsPlanned => Status == SeriesStatus.Planned;
    public bool IsInProgress => Status == SeriesStatus.InProgress;
    public bool IsCompleted => Status == SeriesStatus.Completed;
    public bool IsCancelled => Status == SeriesStatus.Cancelled;
    public bool IsOnHold => Status == SeriesStatus.OnHold;
    public double ProgressPercentage => TotalSessions > 0 ? (double)CompletedSessions / TotalSessions * 100 : 0;
    public int RemainingSessions => TotalSessions - CompletedSessions;

    /// <summary>
    /// Creates a new session series
    /// </summary>
    public static SessionSeries Create(
        string connectionId,
        string title,
        string teacherUserId,
        string learnerUserId,
        string skillId,
        int totalSessions,
        int defaultDurationMinutes = 60,
        string? description = null)
    {
        return new SessionSeries
        {
            Id = Guid.NewGuid().ToString(),
            ConnectionId = connectionId,
            Title = title,
            Description = description,
            TeacherUserId = teacherUserId,
            LearnerUserId = learnerUserId,
            SkillId = skillId,
            TotalSessions = totalSessions,
            DefaultDurationMinutes = defaultDurationMinutes,
            Status = SeriesStatus.Planned,
            PlannedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow
        };
    }

    /// <summary>
    /// Start the series (when first session begins)
    /// </summary>
    public void Start()
    {
        if (Status == SeriesStatus.Planned)
        {
            Status = SeriesStatus.InProgress;
            StartedAt = DateTime.UtcNow;
            UpdatedAt = DateTime.UtcNow;
        }
    }

    /// <summary>
    /// Mark a session as completed
    /// </summary>
    public void CompleteSession()
    {
        CompletedSessions++;
        UpdatedAt = DateTime.UtcNow;

        // Auto-start if this is the first session
        if (CompletedSessions == 1 && Status == SeriesStatus.Planned)
        {
            Start();
        }

        // Auto-complete if all sessions are done
        if (CompletedSessions >= TotalSessions)
        {
            Complete();
        }
    }

    /// <summary>
    /// Mark the series as completed
    /// </summary>
    public void Complete()
    {
        Status = SeriesStatus.Completed;
        CompletedAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Cancel the series
    /// </summary>
    public void Cancel(string reason)
    {
        Status = SeriesStatus.Cancelled;
        StatusReason = reason;
        UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Put series on hold
    /// </summary>
    public void PutOnHold(string reason)
    {
        Status = SeriesStatus.OnHold;
        StatusReason = reason;
        UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Resume series from hold
    /// </summary>
    public void Resume()
    {
        if (Status == SeriesStatus.OnHold)
        {
            Status = CompletedSessions > 0 ? SeriesStatus.InProgress : SeriesStatus.Planned;
            StatusReason = null;
            UpdatedAt = DateTime.UtcNow;
        }
    }
}
