namespace SkillService.Models;

public class Skill
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string UserId { get; set; } = string.Empty;
    public string SkillCategoryId { get; set; } = string.Empty;
    public string ProficiencyLevelId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public bool IsOffering { get; set; }

    public virtual SkillCategory SkillCategory { get; set; } = null!;
    public virtual ProficiencyLevel ProficiencyLevel { get; set; } = null!;
}
