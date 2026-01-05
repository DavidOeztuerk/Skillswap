using System.ComponentModel.DataAnnotations;
using Domain.Abstractions;

namespace UserService.Domain.Models;

/// <summary>
/// Represents a review/rating given by one user to another after a session.
/// </summary>
public class UserReview : AuditableEntity
{
    /// <summary>
    /// The user who wrote the review (reviewer)
    /// </summary>
    [Required]
    public string ReviewerId { get; private set; } = string.Empty;

    /// <summary>
    /// The user being reviewed (reviewee)
    /// </summary>
    [Required]
    public string RevieweeId { get; private set; } = string.Empty;

    /// <summary>
    /// Optional: The session/appointment this review is associated with
    /// </summary>
    public string? SessionId { get; private set; }

    /// <summary>
    /// Optional: The skill this review is associated with
    /// </summary>
    public string? SkillId { get; private set; }

    /// <summary>
    /// Rating from 1-5 stars
    /// </summary>
    [Range(1, 5)]
    public int Rating { get; private set; }

    /// <summary>
    /// Optional review text/comment
    /// </summary>
    [MaxLength(2000)]
    public string? ReviewText { get; private set; }

    /// <summary>
    /// Cached reviewer name for display
    /// </summary>
    [MaxLength(200)]
    public string? ReviewerName { get; private set; }

    /// <summary>
    /// Cached reviewer avatar URL
    /// </summary>
    [MaxLength(500)]
    public string? ReviewerAvatarUrl { get; private set; }

    /// <summary>
    /// Cached skill name for display
    /// </summary>
    [MaxLength(200)]
    public string? SkillName { get; private set; }

    // Navigation properties
    public virtual User? Reviewer { get; set; }
    public virtual User? Reviewee { get; set; }

    // Private constructor for EF
    private UserReview() { }

    /// <summary>
    /// Factory method to create a new review
    /// </summary>
    public static UserReview Create(
        string reviewerId,
        string revieweeId,
        int rating,
        string? reviewText = null,
        string? sessionId = null,
        string? skillId = null,
        string? reviewerName = null,
        string? reviewerAvatarUrl = null,
        string? skillName = null)
    {
        if (rating < 1 || rating > 5)
            throw new ArgumentOutOfRangeException(nameof(rating), "Rating must be between 1 and 5");

        if (reviewerId == revieweeId)
            throw new ArgumentException("Cannot review yourself");

        return new UserReview
        {
            Id = Guid.NewGuid().ToString(),
            ReviewerId = reviewerId,
            RevieweeId = revieweeId,
            Rating = rating,
            ReviewText = reviewText?.Trim(),
            SessionId = sessionId,
            SkillId = skillId,
            ReviewerName = reviewerName,
            ReviewerAvatarUrl = reviewerAvatarUrl,
            SkillName = skillName,
            CreatedAt = DateTime.UtcNow
        };
    }

    /// <summary>
    /// Update an existing review (within edit window)
    /// </summary>
    public void Update(int rating, string? reviewText)
    {
        if (rating < 1 || rating > 5)
            throw new ArgumentOutOfRangeException(nameof(rating), "Rating must be between 1 and 5");

        Rating = rating;
        ReviewText = reviewText?.Trim();
        UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Update cached reviewer info
    /// </summary>
    public void UpdateReviewerInfo(string? name, string? avatarUrl)
    {
        ReviewerName = name;
        ReviewerAvatarUrl = avatarUrl;
        UpdatedAt = DateTime.UtcNow;
    }
}
