using Microsoft.EntityFrameworkCore;
using SkillService.Models;

namespace SkillService;

public class SkillDbContext(
    DbContextOptions<SkillDbContext> options)
    : DbContext(options)
{
    public DbSet<Skill> Skills { get; set; }
}
