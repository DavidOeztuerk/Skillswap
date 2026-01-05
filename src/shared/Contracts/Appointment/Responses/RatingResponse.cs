namespace Contracts.Appointment.Responses;

public record RatingResponse(
    string RatingId,
    int Rating,
    string? Feedback,
    DateTime CreatedAt);

/// <summary>
/// Extended review response for public display
/// </summary>
public record UserReviewResponse(
    string Id,
    string RaterId,
    string RateeId,
    int Rating,
    string? Feedback,
    bool? WouldRecommend,
    DateTime CreatedAt,
    // Section ratings
    int? KnowledgeRating,
    string? KnowledgeComment,
    int? TeachingRating,
    string? TeachingComment,
    int? CommunicationRating,
    string? CommunicationComment,
    int? ReliabilityRating,
    string? ReliabilityComment,
    // Context data
    string? SkillId,
    string? SkillName,
    string? ReviewerName,
    string? ReviewerAvatarUrl,
    // Response from ratee
    string? RateeResponse,
    DateTime? RateeResponseAt
);

/// <summary>
/// Review statistics for histogram display
/// </summary>
public record UserReviewStatsResponse(
    string UserId,
    double AverageRating,
    int TotalReviews,
    Dictionary<int, int> RatingDistribution,
    double? AverageKnowledge,
    double? AverageTeaching,
    double? AverageCommunication,
    double? AverageReliability
);
