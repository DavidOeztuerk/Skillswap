using Microsoft.EntityFrameworkCore;
using SkillService.Domain.Entities;

namespace SkillService;

public class SkillDbContext(
    DbContextOptions<SkillDbContext> options)
    : DbContext(options)
{
    public virtual DbSet<Skill> Skills => base.Set<Skill>();
    public virtual DbSet<SkillCategory> SkillCategories => base.Set<SkillCategory>();
    public virtual DbSet<ProficiencyLevel> ProficiencyLevels => base.Set<ProficiencyLevel>();
    public virtual DbSet<SkillEndorsement> SkillEndorsements => base.Set<SkillEndorsement>();
    public virtual DbSet<SkillMatch> SkillMatches => base.Set<SkillMatch>();
    public virtual DbSet<SkillReview> SkillReviews => base.Set<SkillReview>();
}
