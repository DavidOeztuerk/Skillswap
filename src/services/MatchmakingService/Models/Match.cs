namespace MatchmakingService.Models;

public class Match
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string SkillName { get; set; } = string.Empty;
    public bool IsMatched { get; set; } = false;
    public bool IsConfirmed { get; set; } = false;
    public string SkillSearcherId { get; set; } = string.Empty; // Suchender Nutzer
    public string SkillCreatorId { get; set; } = string.Empty; // Skill-Ersteller
}