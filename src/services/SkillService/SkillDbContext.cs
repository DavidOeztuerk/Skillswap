using Microsoft.EntityFrameworkCore;
using SkillService.Models;

namespace SkillService;

public class SkillDbContext(
    DbContextOptions<SkillDbContext> options)
    : DbContext(options)
{
    public virtual DbSet<Skill> Skills => base.Set<Skill>();
    public virtual DbSet<SkillCategory> SkillCategories => base.Set<SkillCategory>();
    public virtual DbSet<ProficiencyLevel> ProficiencyLevels => base.Set<ProficiencyLevel>();
}
