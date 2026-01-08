using Domain.Abstractions;
using Infrastructure.Models;
using Microsoft.EntityFrameworkCore;
using NotificationService.Domain.Entities;

namespace NotificationService.Infrastructure.Data;

public class NotificationDbContext(
    DbContextOptions<NotificationDbContext> options)
    : DbContext(options)
{
    // Define DbSets for your entities here
    public DbSet<Notification> Notifications { get; set; }
    public DbSet<NotificationPreferences> NotificationPreferences { get; set; }
    public DbSet<NotificationEvent> NotificationEvents { get; set; }
    public DbSet<NotificationCampaign> NotificationCampaigns { get; set; }
    public DbSet<EmailTemplate> EmailTemplates { get; set; }
    public DbSet<NotificationDigestEntry> NotificationDigestEntries { get; set; }
    public DbSet<ReminderSettings> ReminderSettings { get; set; }
    public DbSet<ScheduledReminder> ScheduledReminders { get; set; }

    // Chat entities
    public DbSet<ChatThread> ChatThreads { get; set; }
    public DbSet<ChatMessage> ChatMessages { get; set; }
    public DbSet<ChatAttachment> ChatAttachments { get; set; }

    // Phase 3: Tables replacing JSON/CSV fields
    public DbSet<MessageReaction> MessageReactions { get; set; }
    public DbSet<ReminderTiming> ReminderTimings { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configure Notification entity
        modelBuilder.Entity<Notification>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasMaxLength(450);
            entity.Property(e => e.UserId).HasMaxLength(450).IsRequired();
            entity.Property(e => e.Type).HasMaxLength(50).IsRequired();
            entity.Property(e => e.Template).HasMaxLength(100).IsRequired();
            entity.Property(e => e.Recipient).HasMaxLength(256).IsRequired();
            entity.Property(e => e.Subject).HasMaxLength(500).IsRequired();
            entity.Property(e => e.Content).IsRequired();
            entity.Property(e => e.Status).HasMaxLength(50).IsRequired();
            entity.Property(e => e.Priority).HasMaxLength(50).IsRequired();
            entity.Property(e => e.ErrorMessage).HasMaxLength(1000);
            entity.Property(e => e.ExternalId).HasMaxLength(100);

            // Indexes
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.Type);
            entity.HasIndex(e => e.CreatedAt);
            entity.HasIndex(e => new { e.Status, e.NextRetryAt });
        });

        // Configure NotificationPreferences entity
        modelBuilder.Entity<NotificationPreferences>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasMaxLength(450);
            entity.Property(e => e.UserId).HasMaxLength(450).IsRequired();
            entity.Property(e => e.TimeZone).HasMaxLength(100).IsRequired();
            entity.Property(e => e.DigestFrequency).HasMaxLength(50).IsRequired();
            entity.Property(e => e.Language).HasMaxLength(10).IsRequired();

            // Unique constraint on UserId
            entity.HasIndex(e => e.UserId).IsUnique();
        });

        // Configure NotificationEvent entity
        modelBuilder.Entity<NotificationEvent>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasMaxLength(450);
            entity.Property(e => e.NotificationId).HasMaxLength(450).IsRequired();
            entity.Property(e => e.EventType).HasMaxLength(50).IsRequired();
            entity.Property(e => e.Details).HasMaxLength(1000);

            // Foreign key relationship
            entity.HasOne(e => e.Notification)
                  .WithMany(n => n.Events)
                  .HasForeignKey(e => e.NotificationId)
                  .OnDelete(DeleteBehavior.Cascade);

            // Indexes
            entity.HasIndex(e => e.NotificationId);
            entity.HasIndex(e => e.EventType);
            entity.HasIndex(e => e.Timestamp);
        });

        // Configure NotificationCampaign entity
        modelBuilder.Entity<NotificationCampaign>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasMaxLength(450);
            entity.Property(e => e.Name).HasMaxLength(200).IsRequired();
            entity.Property(e => e.Description).HasMaxLength(1000);
            entity.Property(e => e.Type).HasMaxLength(50).IsRequired();
            entity.Property(e => e.Template).HasMaxLength(100).IsRequired();
            entity.Property(e => e.Status).HasMaxLength(50).IsRequired();

            // Indexes
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.ScheduledAt);
            entity.HasIndex(e => e.CreatedAt);
        });

        // Configure EmailTemplate entity
        modelBuilder.Entity<EmailTemplate>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasMaxLength(450);
            entity.Property(e => e.Name).HasMaxLength(100).IsRequired();
            entity.Property(e => e.Language).HasMaxLength(10).IsRequired();
            entity.Property(e => e.Subject).HasMaxLength(500).IsRequired();
            entity.Property(e => e.HtmlContent).IsRequired();
            entity.Property(e => e.TextContent).IsRequired();
            entity.Property(e => e.Version).HasMaxLength(50).IsRequired();
            entity.Property(e => e.Description).HasMaxLength(1000);

            // Unique constraint on Name + Language
            entity.HasIndex(e => new { e.Name, e.Language }).IsUnique();
            entity.HasIndex(e => e.IsActive);
        });
        
        // Configure NotificationDigestEntry entity
        modelBuilder.Entity<NotificationDigestEntry>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasMaxLength(450);
            entity.Property(e => e.UserId).HasMaxLength(450).IsRequired();
            entity.Property(e => e.Template).HasMaxLength(100).IsRequired();
            entity.Property(e => e.Variables).IsRequired();

            // Indexes
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.IsProcessed);
            entity.HasIndex(e => e.CreatedAt);
        });

        // Configure ReminderSettings entity
        modelBuilder.Entity<ReminderSettings>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasMaxLength(450);
            entity.Property(e => e.UserId).HasMaxLength(450).IsRequired();
            entity.Property(e => e.ReminderMinutesBefore).HasMaxLength(100).IsRequired();

            // Unique constraint on UserId
            entity.HasIndex(e => e.UserId).IsUnique();

            // Phase 3: Navigation to ReminderTimings
            entity.HasMany(e => e.Timings)
                  .WithOne(t => t.ReminderSettings)
                  .HasForeignKey(t => t.ReminderSettingsId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // Configure ScheduledReminder entity
        modelBuilder.Entity<ScheduledReminder>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasMaxLength(450);
            entity.Property(e => e.AppointmentId).HasMaxLength(450).IsRequired();
            entity.Property(e => e.UserId).HasMaxLength(450).IsRequired();
            entity.Property(e => e.ReminderType).HasMaxLength(50).IsRequired();
            entity.Property(e => e.Status).HasMaxLength(50).IsRequired();
            entity.Property(e => e.ErrorMessage).HasMaxLength(1000);
            entity.Property(e => e.PartnerName).HasMaxLength(200);
            entity.Property(e => e.SkillName).HasMaxLength(200);
            entity.Property(e => e.MeetingLink).HasMaxLength(500);

            // Indexes
            entity.HasIndex(e => e.AppointmentId);
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.ScheduledFor);
            entity.HasIndex(e => new { e.Status, e.ScheduledFor });
        });

        // Configure ChatThread entity
        modelBuilder.Entity<ChatThread>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasMaxLength(450);
            entity.Property(e => e.ThreadId).HasMaxLength(450).IsRequired();
            entity.Property(e => e.Participant1Id).HasMaxLength(450).IsRequired();
            entity.Property(e => e.Participant2Id).HasMaxLength(450).IsRequired();
            entity.Property(e => e.Participant1Name).HasMaxLength(200);
            entity.Property(e => e.Participant2Name).HasMaxLength(200);
            entity.Property(e => e.Participant1AvatarUrl).HasMaxLength(500);
            entity.Property(e => e.Participant2AvatarUrl).HasMaxLength(500);
            entity.Property(e => e.SkillId).HasMaxLength(450);
            entity.Property(e => e.SkillName).HasMaxLength(200);
            entity.Property(e => e.MatchId).HasMaxLength(450);
            entity.Property(e => e.LastMessagePreview).HasMaxLength(150);
            entity.Property(e => e.LastMessageSenderId).HasMaxLength(450);
            entity.Property(e => e.LockReason).HasMaxLength(100);

            // Indexes
            entity.HasIndex(e => e.ThreadId).IsUnique();
            entity.HasIndex(e => e.Participant1Id);
            entity.HasIndex(e => e.Participant2Id);
            entity.HasIndex(e => e.MatchId);
            entity.HasIndex(e => e.LastMessageAt);
            entity.HasIndex(e => new { e.Participant1Id, e.LastMessageAt });
            entity.HasIndex(e => new { e.Participant2Id, e.LastMessageAt });
        });

        // Configure ChatMessage entity
        modelBuilder.Entity<ChatMessage>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasMaxLength(450);
            entity.Property(e => e.ThreadId).HasMaxLength(450).IsRequired();
            entity.Property(e => e.SenderId).HasMaxLength(450).IsRequired();
            entity.Property(e => e.SenderName).HasMaxLength(200).IsRequired();
            entity.Property(e => e.SenderAvatarUrl).HasMaxLength(500);
            entity.Property(e => e.Content).HasMaxLength(10000).IsRequired();
            entity.Property(e => e.MessageType).HasMaxLength(50).IsRequired();
            entity.Property(e => e.Context).HasMaxLength(50).IsRequired();
            entity.Property(e => e.ContextReferenceId).HasMaxLength(450);
            entity.Property(e => e.EncryptionKeyId).HasMaxLength(450);
            entity.Property(e => e.EncryptionIV).HasMaxLength(100);
            entity.Property(e => e.FileUrl).HasMaxLength(1000);
            entity.Property(e => e.FileName).HasMaxLength(255);
            entity.Property(e => e.FileMimeType).HasMaxLength(100);
            entity.Property(e => e.ThumbnailUrl).HasMaxLength(1000);
            entity.Property(e => e.CodeLanguage).HasMaxLength(50);
            entity.Property(e => e.GiphyId).HasMaxLength(100);
            entity.Property(e => e.GifUrl).HasMaxLength(1000);
            entity.Property(e => e.ReplyToMessageId).HasMaxLength(450);
            entity.Property(e => e.ReplyToPreview).HasMaxLength(200);
            entity.Property(e => e.ReplyToSenderName).HasMaxLength(200);
            entity.Property(e => e.ReactionsJson).HasMaxLength(4000);
            entity.Property(e => e.MetadataJson).HasMaxLength(4000);

            // Foreign key to ChatThread via ThreadId
            entity.HasOne(e => e.Thread)
                  .WithMany(t => t.Messages)
                  .HasForeignKey(e => e.ThreadId)
                  .HasPrincipalKey(t => t.ThreadId)
                  .OnDelete(DeleteBehavior.Cascade);

            // Phase 3: Navigation to MessageReactions
            entity.HasMany(e => e.Reactions)
                  .WithOne(r => r.Message)
                  .HasForeignKey(r => r.MessageId)
                  .OnDelete(DeleteBehavior.Cascade);

            // Indexes
            entity.HasIndex(e => e.ThreadId);
            entity.HasIndex(e => e.SenderId);
            entity.HasIndex(e => e.SentAt);
            entity.HasIndex(e => e.MessageType);
            entity.HasIndex(e => new { e.ThreadId, e.SentAt });
            entity.HasIndex(e => new { e.ThreadId, e.ReadAt });
        });

        // Configure ChatAttachment entity
        modelBuilder.Entity<ChatAttachment>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasMaxLength(450);
            entity.Property(e => e.MessageId).HasMaxLength(450).IsRequired();
            entity.Property(e => e.ThreadId).HasMaxLength(450).IsRequired();
            entity.Property(e => e.UploaderId).HasMaxLength(450).IsRequired();
            entity.Property(e => e.UploaderName).HasMaxLength(200);
            entity.Property(e => e.FileName).HasMaxLength(255).IsRequired();
            entity.Property(e => e.OriginalFileName).HasMaxLength(255).IsRequired();
            entity.Property(e => e.MimeType).HasMaxLength(100).IsRequired();
            entity.Property(e => e.FileSizeDisplay).HasMaxLength(50);
            entity.Property(e => e.StorageUrl).HasMaxLength(1000).IsRequired();
            entity.Property(e => e.ThumbnailUrl).HasMaxLength(1000);
            entity.Property(e => e.StorageContainer).HasMaxLength(100);
            entity.Property(e => e.StorageBlobName).HasMaxLength(500);
            entity.Property(e => e.ContentHash).HasMaxLength(64);
            entity.Property(e => e.EncryptionKeyId).HasMaxLength(450);
            entity.Property(e => e.EncryptionIV).HasMaxLength(100);
            entity.Property(e => e.ScanResult).HasMaxLength(500);

            // Foreign key to ChatMessage
            entity.HasOne(e => e.Message)
                  .WithMany(m => m.Attachments)
                  .HasForeignKey(e => e.MessageId)
                  .OnDelete(DeleteBehavior.Cascade);

            // Indexes
            entity.HasIndex(e => e.MessageId);
            entity.HasIndex(e => e.ThreadId);
            entity.HasIndex(e => e.UploaderId);
            entity.HasIndex(e => e.ContentHash);
        });

        // ============================================================================
        // PHASE 3: TABLES REPLACING JSON/CSV FIELDS
        // ============================================================================

        // Configure MessageReaction entity (Phase 3 - replaces ChatMessage.ReactionsJson)
        modelBuilder.Entity<MessageReaction>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasMaxLength(450);
            entity.Property(e => e.MessageId).HasMaxLength(450).IsRequired();
            entity.Property(e => e.UserId).HasMaxLength(450).IsRequired();
            entity.Property(e => e.Emoji).HasMaxLength(50).IsRequired();

            // Indexes
            entity.HasIndex(e => e.MessageId);
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => new { e.MessageId, e.UserId, e.Emoji })
                .IsUnique()
                .HasDatabaseName("IX_MessageReactions_Unique");
        });

        // Configure ReminderTiming entity (Phase 3 - replaces ReminderSettings.ReminderMinutesBefore CSV)
        modelBuilder.Entity<ReminderTiming>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasMaxLength(450);
            entity.Property(e => e.ReminderSettingsId).HasMaxLength(450).IsRequired();
            entity.Property(e => e.MinutesBefore).IsRequired();
            entity.Property(e => e.SortOrder).HasDefaultValue(0);
            entity.Property(e => e.IsEnabled).HasDefaultValue(true);

            // Indexes
            entity.HasIndex(e => e.ReminderSettingsId);
            entity.HasIndex(e => new { e.ReminderSettingsId, e.MinutesBefore })
                .IsUnique()
                .HasDatabaseName("IX_ReminderTimings_Unique");
        });

        // Configure soft delete for all entities
        modelBuilder.Entity<Notification>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<NotificationPreferences>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<NotificationEvent>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<NotificationCampaign>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<EmailTemplate>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<ReminderSettings>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<ScheduledReminder>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<ChatThread>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<ChatMessage>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<ChatAttachment>().HasQueryFilter(e => !e.IsDeleted);

        // Phase 3: Soft delete for new entities
        modelBuilder.Entity<MessageReaction>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<ReminderTiming>().HasQueryFilter(e => !e.IsDeleted);
    }

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        // Handle soft delete and audit fields
        var entries = ChangeTracker.Entries()
            .Where(e => e.Entity is AuditableEntity &&
                       (e.State == EntityState.Added || e.State == EntityState.Modified || e.State == EntityState.Deleted));

        foreach (var entry in entries)
        {
            var entity = (AuditableEntity)entry.Entity;

            switch (entry.State)
            {
                case EntityState.Added:
                    entity.Id = entity.Id ?? Guid.NewGuid().ToString();
                    entity.CreatedAt = DateTime.UtcNow;
                    entity.UpdatedAt = DateTime.UtcNow;
                    break;

                case EntityState.Modified:
                    entity.UpdatedAt = DateTime.UtcNow;
                    break;

                case EntityState.Deleted:
                    entry.State = EntityState.Modified;
                    entity.IsDeleted = true;
                    entity.DeletedAt = DateTime.UtcNow;
                    entity.UpdatedAt = DateTime.UtcNow;
                    break;
            }
        }

        return await base.SaveChangesAsync(cancellationToken);
    }
}
