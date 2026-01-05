namespace Contracts.User.Responses;

/// <summary>
/// Response for a user review
/// </summary>
public record UserReviewResponse(
    string Id,
    string ReviewerId,
    string ReviewerName,
    string? ReviewerAvatarUrl,
    int Rating,
    string? ReviewText,
    string? SkillId,
    string? SkillName,
    DateTime CreatedAt);
