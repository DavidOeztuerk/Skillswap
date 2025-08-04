using System.ComponentModel.DataAnnotations;
using Domain.Abstractions;

namespace VideocallService.Domain.Entities;

public class CallParticipant : AuditableEntity
{
    [Required]
    [MaxLength(450)]
    public string SessionId { get; set; } = string.Empty;

    [Required]
    [MaxLength(450)]
    public string UserId { get; set; } = string.Empty;

    [Required]
    [MaxLength(450)]
    public string ConnectionId { get; set; } = string.Empty;

    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LeftAt { get; set; }

    public bool IsInitiator { get; set; } = false;

    public bool CameraEnabled { get; set; } = true;
    public bool MicrophoneEnabled { get; set; } = true;
    public bool ScreenShareEnabled { get; set; } = false;

    [MaxLength(100)]
    public string? DeviceInfo { get; set; }

    [MaxLength(50)]
    public string? IpAddress { get; set; }

    public int? ConnectionQuality { get; set; } // 1-5

    // Navigation properties
    public virtual VideoCallSession Session { get; set; } = null!;

    public int? SessionDurationMinutes => LeftAt.HasValue
        ? (int)(LeftAt.Value - JoinedAt).TotalMinutes
        : null;
}