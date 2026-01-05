namespace Contracts.User.Requests;

/// <summary>
/// Request to create a review for another user
/// </summary>
public record CreateReviewRequest(
    string RevieweeId,
    int Rating,
    string? ReviewText = null,
    string? SessionId = null,
    string? SkillId = null);

/// <summary>
/// Request to update an existing review
/// </summary>
public record UpdateReviewRequest(
    int Rating,
    string? ReviewText = null);
