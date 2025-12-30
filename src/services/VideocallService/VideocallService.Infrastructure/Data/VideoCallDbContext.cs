using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using VideocallService.Domain.Entities;

namespace VideocallService.Infrastructure.Data;

public class VideoCallDbContext(
    DbContextOptions<VideoCallDbContext> options)
    : DbContext(options)
{
    public DbSet<VideoCallSession> VideoCallSessions { get; set; }
    public DbSet<CallParticipant> CallParticipants { get; set; }
    public DbSet<CallAnalytics> CallAnalytics { get; set; }
    public DbSet<CallRecording> CallRecordings { get; set; }
    public DbSet<E2EEAuditLog> E2EEAuditLogs { get; set; }

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
                    v => System.Text.Json.JsonSerializer.Deserialize<List<string>>(v, (System.Text.Json.JsonSerializerOptions?)null) ?? new List<string>())
                .Metadata.SetValueComparer(new ValueComparer<List<string>>(
                    (a, b) => a != null && b != null && a.SequenceEqual(b),
                    v => v.Aggregate(0, (h, s) => HashCode.Combine(h, s.GetHashCode())),
                    v => v == null ? new List<string>() : new List<string>(v)));

            entity.Property(e => e.ConnectionTimes)
                .HasConversion(
                    v => System.Text.Json.JsonSerializer.Serialize(v, (System.Text.Json.JsonSerializerOptions?)null),
                    v => System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, DateTime>>(v, (System.Text.Json.JsonSerializerOptions?)null) ?? new Dictionary<string, DateTime>())
                .Metadata.SetValueComparer(new ValueComparer<Dictionary<string, DateTime>>(
                    (a, b) => a != null && b != null && a.SequenceEqual(b),
                    v => v.Aggregate(0, (h, kv) => HashCode.Combine(h, kv.Key.GetHashCode(), kv.Value.GetHashCode())),
                    v => v == null ? new Dictionary<string, DateTime>() : new Dictionary<string, DateTime>(v)));

            entity.Property(e => e.ConnectionIds)
                .HasConversion(
                    v => System.Text.Json.JsonSerializer.Serialize(v, (System.Text.Json.JsonSerializerOptions?)null),
                    v => System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, string>>(v, (System.Text.Json.JsonSerializerOptions?)null) ?? new Dictionary<string, string>())
                .Metadata.SetValueComparer(new ValueComparer<Dictionary<string, string>>(
                    (a, b) => a != null && b != null && a.SequenceEqual(b),
                    v => v.Aggregate(0, (h, kv) => HashCode.Combine(h, kv.Key.GetHashCode(), kv.Value.GetHashCode())),
                    v => v == null ? new Dictionary<string, string>() : new Dictionary<string, string>(v)));

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
            entity.Property(e => e.DeviceInfo).HasMaxLength(500);  // User-Agent strings can be long
            entity.Property(e => e.IpAddress).HasMaxLength(50);

            entity.HasOne(p => p.Session)
                .WithMany(s => s.Participants)
                .HasForeignKey(p => p.SessionId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasQueryFilter(e => !e.IsDeleted);
        });

        modelBuilder.Entity<CallAnalytics>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.SessionId);
            entity.HasIndex(e => e.CreatedAt);
            entity.HasIndex(e => new { e.SessionId, e.CreatedAt });

            entity.Property(e => e.SessionId).HasMaxLength(450);
            entity.Property(e => e.EndReason).HasMaxLength(100);
            entity.Property(e => e.UserFeedback).HasMaxLength(1000);
            entity.Property(e => e.Metadata).HasMaxLength(4000);

            entity.HasOne(a => a.Session)
                .WithMany()
                .HasForeignKey(a => a.SessionId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasQueryFilter(e => !e.IsDeleted);
        });

        modelBuilder.Entity<CallRecording>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.SessionId);
            entity.HasIndex(e => e.InitiatedByUserId);
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.CreatedAt);
            entity.HasIndex(e => new { e.SessionId, e.Status });

            entity.Property(e => e.SessionId).HasMaxLength(450);
            entity.Property(e => e.InitiatedByUserId).HasMaxLength(450);
            entity.Property(e => e.StorageUrl).HasMaxLength(2000);
            entity.Property(e => e.DownloadUrl).HasMaxLength(2000);
            entity.Property(e => e.Status).HasMaxLength(50);
            entity.Property(e => e.Format).HasMaxLength(50);
            entity.Property(e => e.Codec).HasMaxLength(50);
            entity.Property(e => e.Resolution).HasMaxLength(50);
            entity.Property(e => e.ConsentMetadata).HasMaxLength(2000);
            entity.Property(e => e.Metadata).HasMaxLength(4000);

            entity.HasOne(r => r.Session)
                .WithMany()
                .HasForeignKey(r => r.SessionId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasQueryFilter(e => !e.IsDeleted);
        });

        modelBuilder.Entity<E2EEAuditLog>(entity =>
        {
            entity.HasKey(e => e.Id);

            // Indexes for efficient querying
            entity.HasIndex(e => e.SessionId);
            entity.HasIndex(e => e.RoomId);
            entity.HasIndex(e => e.FromUserId);
            entity.HasIndex(e => e.ServerTimestamp);
            entity.HasIndex(e => new { e.RoomId, e.ServerTimestamp });
            entity.HasIndex(e => new { e.Success, e.ServerTimestamp });
            entity.HasIndex(e => new { e.WasRateLimited, e.ServerTimestamp });

            // Column configurations
            entity.Property(e => e.SessionId).HasMaxLength(450);
            entity.Property(e => e.RoomId).HasMaxLength(450);
            entity.Property(e => e.FromUserId).HasMaxLength(450);
            entity.Property(e => e.ToUserId).HasMaxLength(450);
            entity.Property(e => e.MessageType).HasMaxLength(50);
            entity.Property(e => e.KeyFingerprint).HasMaxLength(64);
            entity.Property(e => e.ErrorCode).HasMaxLength(50);
            entity.Property(e => e.ClientIpAddress).HasMaxLength(45);
            entity.Property(e => e.UserAgent).HasMaxLength(500);

            // No soft delete for audit logs - they are permanent
            // No query filter needed
        });
    }
}
