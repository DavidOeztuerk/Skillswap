using System.ComponentModel.DataAnnotations;
using Infrastructure.Models;

namespace VideocallService.Domain.Entities;

public class VideoCallSession : AuditableEntity
{
    [Required]
    [MaxLength(450)]
    public string RoomId { get; set; } = string.Empty;

    [Required]
    [MaxLength(450)]
    public string InitiatorUserId { get; set; } = string.Empty;

    [Required]
    [MaxLength(450)]
    public string ParticipantUserId { get; set; } = string.Empty;

    [MaxLength(450)]
    public string? AppointmentId { get; set; }

    [MaxLength(450)]
    public string? MatchId { get; set; }

    [MaxLength(50)]
    public string Status { get; set; } = CallStatus.Pending;

    public DateTime? StartedAt { get; set; }
    public DateTime? EndedAt { get; set; }

    public int? ActualDurationMinutes { get; set; }

    [MaxLength(50)]
    public string? EndReason { get; set; }

    [MaxLength(1000)]
    public string? SessionNotes { get; set; }

    public int? QualityRating { get; set; } // 1-5 stars

    [MaxLength(500)]
    public string? TechnicalIssues { get; set; }

    public bool IsRecorded { get; set; } = false;

    [MaxLength(500)]
    public string? RecordingUrl { get; set; }

    public bool ScreenShareUsed { get; set; } = false;

    public bool ChatUsed { get; set; } = false;

    public int ParticipantCount { get; set; } = 0;

    public int MaxParticipants { get; set; } = 2;

    public ICollection<CallParticipant> Participants { get; set; } = [];

    // Connection tracking
    public List<string> ConnectedUserIds { get; set; } = new();
    public Dictionary<string, DateTime> ConnectionTimes { get; set; } = new();
    public Dictionary<string, string> ConnectionIds { get; set; } = new();

    // Helper properties
    public bool IsPending => Status == CallStatus.Pending;
    public bool IsActive => Status == CallStatus.Active;
    public bool IsCompleted => Status == CallStatus.Completed;
    public bool IsCancelled => Status == CallStatus.Cancelled;
    public bool IsExpired => Status == CallStatus.Expired;

    public void Start()
    {
        Status = CallStatus.Active;
        StartedAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }

    public void End(string? reason = null)
    {
        Status = CallStatus.Completed;
        EndedAt = DateTime.UtcNow;
        EndReason = reason;

        if (StartedAt.HasValue)
        {
            ActualDurationMinutes = (int)(EndedAt.Value - StartedAt.Value).TotalMinutes;
        }

        UpdatedAt = DateTime.UtcNow;
    }

    public void Cancel(string? reason = null)
    {
        Status = CallStatus.Cancelled;
        EndedAt = DateTime.UtcNow;
        EndReason = reason;
        UpdatedAt = DateTime.UtcNow;
    }

    public void AddParticipant(string userId, string connectionId)
    {
        if (!ConnectedUserIds.Contains(userId))
        {
            ConnectedUserIds.Add(userId);
            ConnectionTimes[userId] = DateTime.UtcNow;
            ConnectionIds[userId] = connectionId;
            ParticipantCount = ConnectedUserIds.Count;
        }
    }

    public void RemoveParticipant(string userId)
    {
        if (ConnectedUserIds.Contains(userId))
        {
            ConnectedUserIds.Remove(userId);
            ConnectionTimes.Remove(userId);
            ConnectionIds.Remove(userId);
            ParticipantCount = ConnectedUserIds.Count;
        }
    }
}
