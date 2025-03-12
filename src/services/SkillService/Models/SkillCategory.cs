namespace SkillService.Models;

public class Category
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Name { get; set; } = string.Empty;

    public virtual ICollection<Skill> Skills { get; set; } = [];
}
