using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Domain.Abstractions;

namespace AppointmentService.Domain.Entities;

/// <summary>
/// Represents a rating/review for a completed session
/// One rating per session from each participant
/// </summary>
public class SessionRating : AuditableEntity
{
    /// <summary>
    /// The session appointment being rated
    /// </summary>
    [Required]
    [MaxLength(450)]
    public string SessionAppointmentId { get; set; } = string.Empty;

    /// <summary>
    /// Navigation property to SessionAppointment
    /// </summary>
    [ForeignKey(nameof(SessionAppointmentId))]
    public virtual SessionAppointment SessionAppointment { get; set; } = null!;

    /// <summary>
    /// User who gave the rating
    /// </summary>
    [Required]
    [MaxLength(450)]
    public string RaterId { get; set; } = string.Empty;

    /// <summary>
    /// User being rated
    /// </summary>
    [Required]
    [MaxLength(450)]
    public string RateeId { get; set; } = string.Empty;

    /// <summary>
    /// Rating score (1-5 stars)
    /// </summary>
    [Range(1, 5)]
    public int Rating { get; set; }

    /// <summary>
    /// Detailed feedback text
    /// </summary>
    [MaxLength(2000)]
    public string? Feedback { get; set; }

    /// <summary>
    /// Whether this rating is publicly visible
    /// </summary>
    public bool IsPublic { get; set; } = true;

    /// <summary>
    /// Whether the rater would recommend this session/partner
    /// </summary>
    public bool? WouldRecommend { get; set; }

    /// <summary>
    /// Categories for more detailed feedback
    /// </summary>
    [MaxLength(500)]
    public string? Tags { get; set; } // "professional,punctual,knowledgeable" (comma-separated)

    /// <summary>
    /// Response from the ratee (optional)
    /// </summary>
    [MaxLength(1000)]
    public string? RateeResponse { get; set; }

    /// <summary>
    /// When the ratee responded
    /// </summary>
    public DateTime? RateeResponseAt { get; set; }

    /// <summary>
    /// Whether this rating has been flagged as inappropriate
    /// </summary>
    public bool IsFlagged { get; set; } = false;

    /// <summary>
    /// Reason for flagging
    /// </summary>
    [MaxLength(500)]
    public string? FlagReason { get; set; }

    // Helper properties
    public bool IsPositive => Rating >= 4;
    public bool IsNeutral => Rating == 3;
    public bool IsNegative => Rating <= 2;

    /// <summary>
    /// Creates a new session rating
    /// </summary>
    public static SessionRating Create(
        string sessionAppointmentId,
        string raterId,
        string rateeId,
        int rating,
        string? feedback = null,
        bool isPublic = true,
        bool? wouldRecommend = null,
        string? tags = null)
    {
        if (rating < 1 || rating > 5)
            throw new ArgumentException("Rating must be between 1 and 5");

        if (raterId == rateeId)
            throw new ArgumentException("Cannot rate yourself");

        return new SessionRating
        {
            Id = Guid.NewGuid().ToString(),
            SessionAppointmentId = sessionAppointmentId,
            RaterId = raterId,
            RateeId = rateeId,
            Rating = rating,
            Feedback = feedback,
            IsPublic = isPublic,
            WouldRecommend = wouldRecommend,
            Tags = tags,
            CreatedAt = DateTime.UtcNow
        };
    }

    /// <summary>
    /// Respond to a rating
    /// </summary>
    public void Respond(string response)
    {
        if (string.IsNullOrWhiteSpace(response))
            throw new ArgumentException("Response cannot be empty");

        RateeResponse = response;
        RateeResponseAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Flag a rating as inappropriate
    /// </summary>
    public void Flag(string reason)
    {
        if (string.IsNullOrWhiteSpace(reason))
            throw new ArgumentException("Flag reason cannot be empty");

        IsFlagged = true;
        FlagReason = reason;
        UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Resolve a flag (admin action)
    /// </summary>
    public void Unflag()
    {
        IsFlagged = false;
        FlagReason = null;
        UpdatedAt = DateTime.UtcNow;
    }
}
