using System.ComponentModel.DataAnnotations;
using Domain.Abstractions;

namespace VideocallService.Domain.Entities;

/// <summary>
/// PHASE 3.3: Call Analytics Entity
/// Stores detailed analytics and metrics for video call sessions
/// </summary>
public class CallAnalytics : AuditableEntity
{
    /// <summary>
    /// Reference to the video call session
    /// </summary>
    [Required]
    [MaxLength(450)]
    public string SessionId { get; set; } = string.Empty;

    /// <summary>
    /// Total duration of the call in seconds
    /// </summary>
    public int DurationSeconds { get; set; }

    /// <summary>
    /// Number of participants who joined
    /// </summary>
    public int ParticipantCount { get; set; }

    /// <summary>
    /// Average network quality during the call (1-5)
    /// </summary>
    public decimal AverageNetworkQuality { get; set; }

    /// <summary>
    /// Total number of reconnection attempts
    /// </summary>
    public int ReconnectionAttempts { get; set; }

    /// <summary>
    /// Number of successful reconnections
    /// </summary>
    public int SuccessfulReconnections { get; set; }

    /// <summary>
    /// Average packet loss percentage
    /// </summary>
    public decimal AveragePacketLoss { get; set; }

    /// <summary>
    /// Average jitter in milliseconds
    /// </summary>
    public decimal AverageJitter { get; set; }

    /// <summary>
    /// Average round-trip time in milliseconds
    /// </summary>
    public decimal AverageRoundTripTime { get; set; }

    /// <summary>
    /// Peak bandwidth usage in kbps
    /// </summary>
    public int PeakBandwidth { get; set; }

    /// <summary>
    /// Average bandwidth usage in kbps
    /// </summary>
    public int AverageBandwidth { get; set; }

    /// <summary>
    /// Number of chat messages sent
    /// </summary>
    public int ChatMessageCount { get; set; }

    /// <summary>
    /// Whether screen sharing was used
    /// </summary>
    public bool ScreenSharingUsed { get; set; }

    /// <summary>
    /// Duration of screen sharing in seconds
    /// </summary>
    public int ScreenSharingDurationSeconds { get; set; }

    /// <summary>
    /// Whether call was recorded
    /// </summary>
    public bool WasRecorded { get; set; }

    /// <summary>
    /// End reason (Normal, NetworkIssue, UserLeft, Error, etc.)
    /// </summary>
    [MaxLength(100)]
    public string? EndReason { get; set; }

    /// <summary>
    /// User rating (1-5 stars) - if provided
    /// </summary>
    public int? UserRating { get; set; }

    /// <summary>
    /// User feedback text
    /// </summary>
    [MaxLength(1000)]
    public string? UserFeedback { get; set; }

    /// <summary>
    /// Additional metadata as JSON
    /// </summary>
    [MaxLength(4000)]
    public string? Metadata { get; set; }

    // Navigation properties
    public VideoCallSession? Session { get; set; }
}

/// <summary>
/// End reason constants
/// </summary>
public static class CallEndReason
{
    public const string Normal = "Normal";
    public const string NetworkIssue = "NetworkIssue";
    public const string UserLeft = "UserLeft";
    public const string Timeout = "Timeout";
    public const string Error = "Error";
    public const string Cancelled = "Cancelled";
}
