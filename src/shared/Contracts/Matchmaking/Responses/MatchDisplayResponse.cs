namespace Contracts.Matchmaking.Responses;

/// <summary>
/// Display-focused match response - contains all data needed for UI
/// </summary>
public record MatchDisplayResponse(
    string Id,
    string SkillId,
    string SkillName,
    string SkillCategory,
    string Status, // pending, accepted, rejected, completed, cancelled
    
    // Partner info
    string PartnerId,
    string PartnerName,
    decimal PartnerRating,
    string? PartnerAvatar,
    
    // Match details
    bool IsOffering, // Am I offering this skill?
    decimal? CompatibilityScore,
    
    // Timestamps
    DateTime CreatedAt,
    DateTime? AcceptedAt,
    DateTime? CompletedAt
)
{
    public string ApiVersion => "v1";
}