namespace SkillService.Models;

public class ProficiencyLevel
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Level { get; set; } = string.Empty;
    public int Rank { get; set; }

    public virtual ICollection<Skill> Skills { get; set; } = [];
}