namespace SkillService.Models;

public class Skill
{
    public string SkillId { get; set; } = Guid.NewGuid().ToString();
    public string UserId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public bool IsOffering { get; set; } = true;
}
