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

    // Note: Phase 9 - Cached display fields (ReviewerName, ReviewerAvatarUrl, SkillName) removed
    // Display data should be loaded from UserService/SkillService when needed

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
        string? skillId = null)
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

    // Note: UpdateReviewerInfo removed in Phase 9 - cached fields eliminated
}
