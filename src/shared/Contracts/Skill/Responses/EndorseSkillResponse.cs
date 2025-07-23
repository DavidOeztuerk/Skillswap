namespace Contracts.Skill.Responses;

/// <summary>
/// API response for EndorseSkill operation
/// </summary>
public record EndorseSkillResponse(
    string EndorsementId,
    int TotalEndorsements)
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}
