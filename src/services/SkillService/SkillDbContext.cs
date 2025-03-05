using Microsoft.EntityFrameworkCore;
using SkillService.Models;

namespace SkillService;

public class SkillDbContext(
    DbContextOptions<SkillDbContext> options)
    : DbContext(options)
{
    public DbSet<Skill> Skills { get; set; }
}

public class JwtSettings
{
    public const string SectionName = "JwtSettings";
    public string Secret { get; set; } = null!;
    public string Issuer { get; set; } = null!;
    public string Audience { get; set; } = null!;
    public int ExpireMinutes { get; set; }
}
