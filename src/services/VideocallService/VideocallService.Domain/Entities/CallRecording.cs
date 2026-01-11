using System.ComponentModel.DataAnnotations;
using Domain.Abstractions;

namespace VideocallService.Domain.Entities;

/// <summary>
/// Stores metadata about call recordings
/// Note: Actual video files stored in blob storage, this is just metadata
/// </summary>
public class CallRecording : AuditableEntity
{
  /// <summary>
  /// Reference to the video call session
  /// </summary>
  [Required]
  [MaxLength(450)]
  public string SessionId { get; set; } = string.Empty;

  /// <summary>
  /// User who initiated the recording
  /// </summary>
  [Required]
  [MaxLength(450)]
  public string InitiatedByUserId { get; set; } = string.Empty;

  /// <summary>
  /// When recording started
  /// </summary>
  [Required]
  public DateTime StartedAt { get; set; } = DateTime.UtcNow;

  /// <summary>
  /// When recording stopped
  /// </summary>
  public DateTime? StoppedAt { get; set; }

  /// <summary>
  /// Duration in seconds
  /// </summary>
  public int DurationSeconds { get; set; }

  /// <summary>
  /// File size in bytes
  /// </summary>
  public long FileSizeBytes { get; set; }

  /// <summary>
  /// Storage URL (blob storage path)
  /// </summary>
  [MaxLength(2000)]
  public string? StorageUrl { get; set; }

  /// <summary>
  /// Downloadable URL (with SAS token)
  /// </summary>
  [MaxLength(2000)]
  public string? DownloadUrl { get; set; }

  /// <summary>
  /// URL expiration (for SAS tokens)
  /// </summary>
  public DateTime? UrlExpiresAt { get; set; }

  /// <summary>
  /// Recording status
  /// </summary>
  [Required]
  [MaxLength(50)]
  public string Status { get; set; } = RecordingStatus.Recording;

  /// <summary>
  /// Video format (webm, mp4, etc.)
  /// </summary>
  [MaxLength(50)]
  public string? Format { get; set; }

  /// <summary>
  /// Video codec used
  /// </summary>
  [MaxLength(50)]
  public string? Codec { get; set; }

  /// <summary>
  /// Resolution (e.g., "1920x1080")
  /// </summary>
  [MaxLength(50)]
  public string? Resolution { get; set; }

  /// <summary>
  /// Bitrate in kbps
  /// </summary>
  public int? Bitrate { get; set; }

  /// <summary>
  /// Whether recording includes audio
  /// </summary>
  public bool IncludesAudio { get; set; } = true;

  /// <summary>
  /// Whether recording includes video
  /// </summary>
  public bool IncludesVideo { get; set; } = true;

  /// <summary>
  /// Whether recording includes screen share
  /// </summary>
  public bool IncludesScreenShare { get; set; } = false;

  /// <summary>
  /// Recording retention policy - when to delete
  /// </summary>
  public DateTime? DeleteAfter { get; set; }

  /// <summary>
  /// Whether all participants consented to recording
  /// </summary>
  public bool AllParticipantsConsented { get; set; }

  /// <summary>
  /// Consent timestamps (JSON)
  /// </summary>
  [MaxLength(2000)]
  public string? ConsentMetadata { get; set; }

  /// <summary>
  /// Additional metadata as JSON
  /// </summary>
  [MaxLength(4000)]
  public string? Metadata { get; set; }

  // Navigation properties
  public VideoCallSession? Session { get; set; }
}

/// <summary>
/// Recording status constants
/// </summary>
public static class RecordingStatus
{
  public const string Recording = "Recording";
  public const string Processing = "Processing";
  public const string Ready = "Ready";
  public const string Failed = "Failed";
  public const string Deleted = "Deleted";
}
