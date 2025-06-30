using MatchmakingService.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MatchmakingService;

public class MatchmakingDbContext(
    DbContextOptions<MatchmakingDbContext> options)
    : DbContext(options)
{
    public DbSet<Match> Matches { get; set; }
    public DbSet<MatchRequest> MatchRequests { get; set; }
    // public DbSet<DirectMatchRequest> DirectMatchRequests { get; set; } // ✅ NEU

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Match>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.OfferingUserId);
            entity.HasIndex(e => e.RequestingUserId);
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.CreatedAt);
            entity.HasIndex(e => new { e.Status, e.CreatedAt });

            entity.Property(e => e.OfferedSkillName).HasMaxLength(100);
            entity.Property(e => e.RequestedSkillName).HasMaxLength(100);
            entity.Property(e => e.Status).HasMaxLength(50).HasDefaultValue(MatchStatus.Pending);
            entity.Property(e => e.MatchReason).HasMaxLength(500);

            entity.HasQueryFilter(e => !e.IsDeleted);
        });

        modelBuilder.Entity<MatchRequest>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();

            entity.HasIndex(e => e.RequesterId);
            // entity.HasIndex(e => new { e.TargetUserId, e.Status });
            entity.HasIndex(e => e.SkillId);
            // entity.HasIndex(e => e.IsOffering);
            entity.HasIndex(e => e.Status);
            // entity.HasIndex(e => new { e.IsOffering, e.Status });

            // entity.Property(e => e.SkillName).HasMaxLength(100);
            entity.Property(e => e.Status).HasMaxLength(50).HasDefaultValue("Active");
            // entity.Property(e => e.PreferredLocation).HasMaxLength(200);

            entity.HasIndex(e => new { e.RequesterId, e.SkillId, e.Status })
                .HasFilter("Status = 'Pending' AND IsDeleted = 0")
                .IsUnique()
                .HasDatabaseName("IX_DirectMatchRequest_Unique_Pending");

            // Convert lists to JSON
            entity.Property(e => e.PreferredTags)
                .HasConversion(
                    v => System.Text.Json.JsonSerializer.Serialize(v, (System.Text.Json.JsonSerializerOptions?)null),
                    v => System.Text.Json.JsonSerializer.Deserialize<List<string>>(v, (System.Text.Json.JsonSerializerOptions?)null) ?? new List<string>());

            entity.Property(e => e.RequiredSkills)
                .HasConversion(
                    v => System.Text.Json.JsonSerializer.Serialize(v, (System.Text.Json.JsonSerializerOptions?)null),
                    v => System.Text.Json.JsonSerializer.Deserialize<List<string>>(v, (System.Text.Json.JsonSerializerOptions?)null) ?? new List<string>());

            entity.HasQueryFilter(e => !e.IsDeleted);
        });

        // DirectMatchRequest Configuration
        // modelBuilder.Entity<DirectMatchRequest>(entity =>
        // {
        //     entity.HasKey(e => e.Id);
        //     entity.Property(e => e.Id).ValueGeneratedOnAdd();

        //     // Performance indexes
        //     entity.HasIndex(e => new { e.RequesterId, e.Status });
        //     entity.HasIndex(e => new { e.TargetUserId, e.Status });
        //     entity.HasIndex(e => new { e.SkillId, e.Status });
        //     entity.HasIndex(e => e.ExpiresAt);
        //     entity.HasIndex(e => e.CreatedAt);

        //     // Unique constraint for pending requests
        //     entity.HasIndex(e => new { e.RequesterId, e.TargetUserId, e.SkillId, e.Status })
        //         .HasFilter("Status = 'Pending' AND IsDeleted = 0")
        //         .IsUnique()
        //         .HasDatabaseName("IX_DirectMatchRequest_Unique_Pending");
        // });
    }
}
