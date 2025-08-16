using MatchmakingService.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;

namespace MatchmakingService;

public class MatchmakingDbContext(
    DbContextOptions<MatchmakingDbContext> options)
    : DbContext(options)
{
    public DbSet<Match> Matches { get; set; }
    public DbSet<MatchRequest> MatchRequests { get; set; }
    // public DbSet<DirectMatchRequest> DirectMatchRequests { get; set; }

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

            entity.Property(e => e.ThreadId).HasMaxLength(450);
            entity.Property(e => e.OriginalRequestId).HasMaxLength(450);
            entity.Property(e => e.ExchangeSkillId).HasMaxLength(450);
            entity.Property(e => e.ExchangeSkillName).HasMaxLength(100);
            entity.Property(e => e.Currency).HasMaxLength(3);
            entity.Property(e => e.AgreedAmount).HasPrecision(18, 2);

            entity.Property(e => e.OfferedSkillName).HasMaxLength(100);
            entity.Property(e => e.RequestedSkillName).HasMaxLength(100);
            entity.Property(e => e.Status).HasMaxLength(50).HasDefaultValue(MatchStatus.Pending);
            entity.Property(e => e.MatchReason).HasMaxLength(500);

            entity.Property(e => e.AgreedDays)
                .HasConversion(
                    v => System.Text.Json.JsonSerializer.Serialize(v, (System.Text.Json.JsonSerializerOptions?)null),
                    v => System.Text.Json.JsonSerializer.Deserialize<List<string>>(v, (System.Text.Json.JsonSerializerOptions?)null) ?? new List<string>())
                .Metadata.SetValueComparer(new ValueComparer<List<string>>(
                    (a, b) => a != null && b != null && a.SequenceEqual(b),
                    v => v.Aggregate(0, (h, s) => HashCode.Combine(h, s.GetHashCode())),
                    v => v == null ? new List<string>() : new List<string>(v)));

            entity.Property(e => e.AgreedTimes)
                .HasConversion(
                    v => System.Text.Json.JsonSerializer.Serialize(v, (System.Text.Json.JsonSerializerOptions?)null),
                    v => System.Text.Json.JsonSerializer.Deserialize<List<string>>(v, (System.Text.Json.JsonSerializerOptions?)null) ?? new List<string>())
                .Metadata.SetValueComparer(new ValueComparer<List<string>>(
                    (a, b) => a != null && b != null && a.SequenceEqual(b),
                    v => v.Aggregate(0, (h, s) => HashCode.Combine(h, s.GetHashCode())),
                    v => v == null ? new List<string>() : new List<string>(v)));

            // Indexes
            entity.HasIndex(e => e.ThreadId);
            entity.HasIndex(e => e.OriginalRequestId);

            entity.HasQueryFilter(e => !e.IsDeleted);
        });

        modelBuilder.Entity<MatchRequest>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();

            entity.HasIndex(e => e.RequesterId);
            entity.HasIndex(e => e.SkillId);
            // entity.HasIndex(e => e.IsOffering);
            entity.HasIndex(e => e.Status);
            // entity.HasIndex(e => new { e.IsOffering, e.Status });

            // entity.Property(e => e.SkillName).HasMaxLength(100);
            entity.Property(e => e.Status).HasMaxLength(50);

            entity.Property(e => e.ThreadId).HasMaxLength(450);
            // entity.Property(e => e.ParentRequestId).HasMaxLength(450);
            entity.Property(e => e.ExchangeSkillId).HasMaxLength(450);
            // entity.Property(e => e.ExchangeSkillName).HasMaxLength(100);
            entity.Property(e => e.Currency).HasMaxLength(3).HasDefaultValue("EUR");
            entity.Property(e => e.OfferedAmount).HasPrecision(18, 2);

            // entity.HasIndex(e => new { e.RequesterId, e.SkillId, e.Status })
            //     .HasFilter("Status = 'Pending' AND IsDeleted = 0")
            //     .IsUnique()
            //     .HasDatabaseName("IX_DirectMatchRequest_Unique_Pending");

            // entity.HasOne(e => e.ParentRequest)
            //     .WithMany(e => e.CounterOffers)
            //     .HasForeignKey(e => e.ThreadId)
            //     .OnDelete(DeleteBehavior.Restrict);

            // Indexes
            entity.HasIndex(e => e.ThreadId);
            // entity.HasIndex(e => e.ParentRequestId);

            // Convert lists to JSON
            entity.Property(e => e.PreferredTags)
                .HasConversion(
                    v => System.Text.Json.JsonSerializer.Serialize(v, (System.Text.Json.JsonSerializerOptions?)null),
                    v => System.Text.Json.JsonSerializer.Deserialize<List<string>>(v, (System.Text.Json.JsonSerializerOptions?)null) ?? new List<string>())
                .Metadata.SetValueComparer(new ValueComparer<List<string>>(
                    (a, b) => a != null && b != null && a.SequenceEqual(b),
                    v => v.Aggregate(0, (h, s) => HashCode.Combine(h, s.GetHashCode())),
                    v => v == null ? new List<string>() : new List<string>(v)));

            entity.Property(e => e.RequiredSkills)
                .HasConversion(
                    v => System.Text.Json.JsonSerializer.Serialize(v, (System.Text.Json.JsonSerializerOptions?)null),
                    v => System.Text.Json.JsonSerializer.Deserialize<List<string>>(v, (System.Text.Json.JsonSerializerOptions?)null) ?? new List<string>())
                .Metadata.SetValueComparer(new ValueComparer<List<string>>(
                    (a, b) => a != null && b != null && a.SequenceEqual(b),
                    v => v.Aggregate(0, (h, s) => HashCode.Combine(h, s.GetHashCode())),
                    v => v == null ? new List<string>() : new List<string>(v)));

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
        //     // entity.HasIndex(e => new { e.RequesterId, e.TargetUserId, e.SkillId, e.Status })
        //     //     .HasFilter("Status = 'Pending' AND IsDeleted = 0")
        //     //     .IsUnique()
        //     //     .HasDatabaseName("IX_DirectMatchRequest_Unique_Pending");

        //     entity.Property(e => e.Status).HasMaxLength(50);
        //     entity.Property(e => e.Message).HasMaxLength(500);
        //     entity.Property(e => e.ResponseMessage).HasMaxLength(500);
        //     entity.Property(e => e.SkillName).HasMaxLength(100);
        //     entity.Property(e => e.RequesterName).HasMaxLength(100);
        //     entity.Property(e => e.TargetUserName).HasMaxLength(100);

        //     entity.HasQueryFilter(e => !e.IsDeleted);
        // });
    }
}
