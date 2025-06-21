using Microsoft.EntityFrameworkCore;
using VideocallService.Domain.Entities;

namespace VideocallService;

public class VideoCallDbContext(
    DbContextOptions<VideoCallDbContext> options)
    : DbContext(options)
{
    public DbSet<VideoCallSession> VideoCallSessions { get; set; }
    public DbSet<CallParticipant> CallParticipants { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<VideoCallSession>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.RoomId).IsUnique();
            entity.HasIndex(e => e.InitiatorUserId);
            entity.HasIndex(e => e.ParticipantUserId);
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.CreatedAt);
            entity.HasIndex(e => new { e.Status, e.CreatedAt });

            entity.Property(e => e.RoomId).HasMaxLength(450);
            entity.Property(e => e.Status).HasMaxLength(50).HasDefaultValue(CallStatus.Pending);
            entity.Property(e => e.EndReason).HasMaxLength(50);
            entity.Property(e => e.MaxParticipants).HasDefaultValue(2);

            // Convert collections to JSON
            entity.Property(e => e.ConnectedUserIds)
                .HasConversion(
                    v => System.Text.Json.JsonSerializer.Serialize(v, (System.Text.Json.JsonSerializerOptions?)null),
                    v => System.Text.Json.JsonSerializer.Deserialize<List<string>>(v, (System.Text.Json.JsonSerializerOptions?)null) ?? new List<string>());

            entity.Property(e => e.ConnectionTimes)
                .HasConversion(
                    v => System.Text.Json.JsonSerializer.Serialize(v, (System.Text.Json.JsonSerializerOptions?)null),
                    v => System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, DateTime>>(v, (System.Text.Json.JsonSerializerOptions?)null) ?? new Dictionary<string, DateTime>());

            entity.Property(e => e.ConnectionIds)
                .HasConversion(
                    v => System.Text.Json.JsonSerializer.Serialize(v, (System.Text.Json.JsonSerializerOptions?)null),
                    v => System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, string>>(v, (System.Text.Json.JsonSerializerOptions?)null) ?? new Dictionary<string, string>());

            entity.HasQueryFilter(e => !e.IsDeleted);
        });

        modelBuilder.Entity<CallParticipant>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.SessionId);
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.ConnectionId);
            entity.HasIndex(e => new { e.SessionId, e.UserId });

            entity.Property(e => e.ConnectionId).HasMaxLength(450);
            entity.Property(e => e.DeviceInfo).HasMaxLength(100);
            entity.Property(e => e.IpAddress).HasMaxLength(50);

            entity.HasOne(p => p.Session)
                .WithMany(s => s.Participants)
                .HasForeignKey(p => p.SessionId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasQueryFilter(e => !e.IsDeleted);
        });
    }
}
