using Microsoft.EntityFrameworkCore;
using SkillService.Domain.Entities;

namespace SkillService;

public class SkillDbContext(DbContextOptions<SkillDbContext> options) : DbContext(options)
{
    public virtual DbSet<Skill> Skills => base.Set<Skill>();
    public virtual DbSet<SkillCategory> SkillCategories => base.Set<SkillCategory>();
    public virtual DbSet<ProficiencyLevel> ProficiencyLevels => base.Set<ProficiencyLevel>();
    public virtual DbSet<SkillEndorsement> SkillEndorsements => base.Set<SkillEndorsement>();
    public virtual DbSet<SkillMatch> SkillMatches => base.Set<SkillMatch>();
    public virtual DbSet<SkillReview> SkillReviews => base.Set<SkillReview>();
    public virtual DbSet<SkillView> SkillViews => base.Set<SkillView>();
    public virtual DbSet<SkillResource> SkillResources => base.Set<SkillResource>();
    public virtual DbSet<SkillFavorite> SkillFavorites => base.Set<SkillFavorite>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // ============================================================================
        // SKILL ENTITY CONFIGURATION
        // ============================================================================
        modelBuilder.Entity<Skill>(entity =>
        {
            entity.HasKey(e => e.Id);

            // Required properties
            entity.Property(e => e.UserId).IsRequired().HasMaxLength(450);
            entity.Property(e => e.SkillCategoryId).IsRequired().HasMaxLength(450);
            entity.Property(e => e.ProficiencyLevelId).IsRequired().HasMaxLength(450);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Description).IsRequired().HasMaxLength(2000);

            // Optional properties
            entity.Property(e => e.Requirements).HasMaxLength(1000);
            entity.Property(e => e.TagsJson).HasColumnType("text");
            entity.Property(e => e.SearchKeywords).HasMaxLength(500);

            // Exchange properties
            entity.Property(e => e.ExchangeType).HasMaxLength(20).HasDefaultValue("skill_exchange");
            entity.Property(e => e.DesiredSkillCategoryId).HasMaxLength(450);
            entity.Property(e => e.DesiredSkillDescription).HasMaxLength(500);
            entity.Property(e => e.HourlyRate).HasPrecision(10, 2);
            entity.Property(e => e.Currency).HasMaxLength(3);

            // Scheduling properties (JSON arrays)
            entity.Property(e => e.PreferredDaysJson).HasColumnType("text");
            entity.Property(e => e.PreferredTimesJson).HasColumnType("text");
            entity.Property(e => e.SessionDurationMinutes).HasDefaultValue(60);
            entity.Property(e => e.TotalSessions).HasDefaultValue(1);

            // Location properties
            entity.Property(e => e.LocationType).HasMaxLength(20).HasDefaultValue("remote");
            entity.Property(e => e.LocationAddress).HasMaxLength(200);
            entity.Property(e => e.LocationCity).HasMaxLength(100);
            entity.Property(e => e.LocationPostalCode).HasMaxLength(20);
            entity.Property(e => e.LocationCountry).HasMaxLength(2);
            entity.Property(e => e.MaxDistanceKm).HasDefaultValue(50);
            entity.Property(e => e.LocationLatitude).HasPrecision(9, 6);
            entity.Property(e => e.LocationLongitude).HasPrecision(9, 6);

            // Ignore computed properties (not mapped to DB)
            entity.Ignore(e => e.Tags);
            entity.Ignore(e => e.PreferredDays);
            entity.Ignore(e => e.PreferredTimes);
            entity.Ignore(e => e.IsSkillExchange);
            entity.Ignore(e => e.IsPayment);
            entity.Ignore(e => e.IsRemote);
            entity.Ignore(e => e.IsInPerson);
            entity.Ignore(e => e.IsBothLocations);
            entity.Ignore(e => e.HasGeoLocation);
            entity.Ignore(e => e.IsHighlyRated);
            entity.Ignore(e => e.IsPopular);
            entity.Ignore(e => e.IsRecent);

            // Indexes for performance
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.SkillCategoryId);
            entity.HasIndex(e => e.ProficiencyLevelId);
            entity.HasIndex(e => e.IsActive);
            entity.HasIndex(e => e.AverageRating);
            entity.HasIndex(e => new { e.IsActive, e.AverageRating });
            
            // Composite index for most common search query
            entity.HasIndex(e => new { e.IsActive, e.IsDeleted, e.UserId })
                .HasDatabaseName("IX_Skills_ActiveSearch");
            
            // Index for text search
            entity.HasIndex(e => e.Name)
                .HasDatabaseName("IX_Skills_Name");
            entity.HasIndex(e => e.SearchKeywords)
                .HasDatabaseName("IX_Skills_SearchKeywords");

            // Indexes for matching algorithm
            entity.HasIndex(e => e.ExchangeType)
                .HasDatabaseName("IX_Skills_ExchangeType");
            entity.HasIndex(e => e.LocationType)
                .HasDatabaseName("IX_Skills_LocationType");
            entity.HasIndex(e => new { e.LocationCity, e.LocationCountry })
                .HasDatabaseName("IX_Skills_Location");
            entity.HasIndex(e => new { e.IsActive, e.IsOffered, e.SkillCategoryId })
                .HasDatabaseName("IX_Skills_MatchingSearch");

            // Foreign Key Relationships
            entity.HasOne(s => s.SkillCategory)
                  .WithMany(sc => sc.Skills)
                  .HasForeignKey(s => s.SkillCategoryId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(s => s.ProficiencyLevel)
                  .WithMany(pl => pl.Skills)
                  .HasForeignKey(s => s.ProficiencyLevelId)
                  .OnDelete(DeleteBehavior.Restrict);

            // One-to-Many relationships
            entity.HasMany(s => s.Reviews)
                  .WithOne(r => r.Skill)
                  .HasForeignKey(r => r.SkillId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(s => s.Endorsements)
                  .WithOne(e => e.Skill)
                  .HasForeignKey(e => e.SkillId)
                  .OnDelete(DeleteBehavior.Cascade);

            // Configure the navigation property for SkillMatch
            entity.HasMany(s => s.Matches)
                  .WithOne(m => m.OfferedSkill)
                  .HasForeignKey(m => m.OfferedSkillId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // ============================================================================
        // SKILL CATEGORY ENTITY CONFIGURATION
        // ============================================================================
        modelBuilder.Entity<SkillCategory>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.Property(e => e.Name).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Description).HasMaxLength(500);
            entity.Property(e => e.IconName).HasMaxLength(50);
            entity.Property(e => e.Color).HasMaxLength(7);
            entity.Property(e => e.Slug).HasMaxLength(100);

            // Unique constraints
            entity.HasIndex(e => e.Name).IsUnique();
            entity.HasIndex(e => e.Slug).IsUnique();
        });

        // ============================================================================
        // PROFICIENCY LEVEL ENTITY CONFIGURATION
        // ============================================================================
        modelBuilder.Entity<ProficiencyLevel>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.Property(e => e.Level).IsRequired().HasMaxLength(30);
            entity.Property(e => e.Description).HasMaxLength(500);
            entity.Property(e => e.Color).HasMaxLength(7);

            // Unique constraints
            entity.HasIndex(e => e.Level).IsUnique();
            entity.HasIndex(e => e.Rank).IsUnique();
        });

        // ============================================================================
        // SKILL ENDORSEMENT ENTITY CONFIGURATION
        // ============================================================================
        modelBuilder.Entity<SkillEndorsement>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.Property(e => e.SkillId).IsRequired().HasMaxLength(450);
            entity.Property(e => e.EndorserUserId).IsRequired().HasMaxLength(450);
            entity.Property(e => e.EndorsedUserId).IsRequired().HasMaxLength(450);
            entity.Property(e => e.Message).HasMaxLength(500);
            entity.Property(e => e.Relationship).HasMaxLength(100);

            // Indexes
            entity.HasIndex(e => e.SkillId);
            entity.HasIndex(e => e.EndorserUserId);
            entity.HasIndex(e => e.EndorsedUserId);

            // Prevent duplicate endorsements
            entity.HasIndex(e => new { e.SkillId, e.EndorserUserId }).IsUnique();
        });

        // ============================================================================
        // SKILL MATCH ENTITY CONFIGURATION
        // ============================================================================
        modelBuilder.Entity<SkillMatch>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.Property(e => e.OfferedSkillId).IsRequired().HasMaxLength(450);
            entity.Property(e => e.RequestedSkillId).IsRequired().HasMaxLength(450);
            entity.Property(e => e.OfferingUserId).IsRequired().HasMaxLength(450);
            entity.Property(e => e.RequestingUserId).IsRequired().HasMaxLength(450);
            entity.Property(e => e.Status).IsRequired().HasMaxLength(50);
            entity.Property(e => e.CancellationReason).HasMaxLength(500);
            entity.Property(e => e.MatchReason).HasMaxLength(200);
            entity.Property(e => e.SessionType).HasMaxLength(50);

            // Indexes for performance
            entity.HasIndex(e => e.OfferedSkillId);
            entity.HasIndex(e => e.RequestedSkillId);
            entity.HasIndex(e => e.OfferingUserId);
            entity.HasIndex(e => e.RequestingUserId);
            entity.HasIndex(e => e.Status);

            // Foreign key for RequestedSkill
            entity.HasOne(m => m.RequestedSkill)
                  .WithMany() // No navigation property back to matches from requested skill
                  .HasForeignKey(m => m.RequestedSkillId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // ============================================================================
        // SKILL REVIEW ENTITY CONFIGURATION
        // ============================================================================
        modelBuilder.Entity<SkillReview>(entity =>
   {
       entity.HasKey(e => e.Id);

       entity.Property(e => e.SkillId).IsRequired().HasMaxLength(450);
       entity.Property(e => e.ReviewerUserId).IsRequired().HasMaxLength(450);
       entity.Property(e => e.ReviewedUserId).IsRequired().HasMaxLength(450);
       entity.Property(e => e.Rating).IsRequired();
       entity.Property(e => e.Comment).HasMaxLength(1000);
       entity.Property(e => e.TagsJson).HasColumnType("text");
       entity.Property(e => e.ReviewContext).HasMaxLength(50);

       // ✅ KORRIGIERT: PostgreSQL-kompatible Check Constraint mit Anführungszeichen
       entity.ToTable(t => t.HasCheckConstraint("CK_SkillReview_Rating", "\"Rating\" >= 1 AND \"Rating\" <= 5"));

       // Indexes
       entity.HasIndex(e => e.SkillId);
       entity.HasIndex(e => e.ReviewerUserId);
       entity.HasIndex(e => e.ReviewedUserId);
       entity.HasIndex(e => e.Rating);
       entity.HasIndex(e => e.IsVisible);

       // Prevent duplicate reviews
       entity.HasIndex(e => new { e.SkillId, e.ReviewerUserId }).IsUnique();
   });

        // ============================================================================
        // SKILL VIEW ENTITY CONFIGURATION
        // ============================================================================
        modelBuilder.Entity<SkillView>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.Property(e => e.SkillId).IsRequired().HasMaxLength(450);
            entity.Property(e => e.ViewerUserId).HasMaxLength(450);
            entity.Property(e => e.IpAddress).HasMaxLength(45);

            // Indexes
            entity.HasIndex(e => e.SkillId);
            entity.HasIndex(e => e.ViewerUserId);
            entity.HasIndex(e => e.ViewedAt);

            // Foreign key relationship
            entity.HasOne(v => v.Skill)
                  .WithMany(s => s.Views)
                  .HasForeignKey(v => v.SkillId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // ============================================================================
        // SKILL RESOURCE ENTITY CONFIGURATION
        // ============================================================================
        modelBuilder.Entity<SkillResource>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.Property(e => e.SkillId).IsRequired().HasMaxLength(450);
            entity.Property(e => e.Title).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Description).HasMaxLength(1000);
            entity.Property(e => e.Type).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Url).HasMaxLength(500);
            entity.Property(e => e.FilePath).HasMaxLength(500);
            entity.Property(e => e.Currency).HasMaxLength(10);
            entity.Property(e => e.Language).HasMaxLength(50);
            entity.Property(e => e.DifficultyLevel).HasMaxLength(50);

            // Indexes
            entity.HasIndex(e => e.SkillId);
            entity.HasIndex(e => e.Type);
            entity.HasIndex(e => e.IsActive);

            // Foreign key relationship
            entity.HasOne(r => r.Skill)
                  .WithMany()
                  .HasForeignKey(r => r.SkillId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // ============================================================================
        // SKILL FAVORITE ENTITY CONFIGURATION
        // ============================================================================
        modelBuilder.Entity<SkillFavorite>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.Property(e => e.UserId).IsRequired().HasMaxLength(450);
            entity.Property(e => e.SkillId).IsRequired().HasMaxLength(450);

            // Composite unique index (a user can only favorite a skill once)
            entity.HasIndex(e => new { e.UserId, e.SkillId })
                .IsUnique()
                .HasDatabaseName("IX_SkillFavorites_UserSkill");

            // Index for user queries (get all favorites of a user)
            entity.HasIndex(e => e.UserId)
                .HasDatabaseName("IX_SkillFavorites_UserId");

            // Index for skill queries (count favorites for a skill)
            entity.HasIndex(e => e.SkillId)
                .HasDatabaseName("IX_SkillFavorites_SkillId");

            // Foreign key relationship with cascade delete
            entity.HasOne(f => f.Skill)
                  .WithMany()
                  .HasForeignKey(f => f.SkillId)
                  .OnDelete(DeleteBehavior.Cascade);
        });
    }
}