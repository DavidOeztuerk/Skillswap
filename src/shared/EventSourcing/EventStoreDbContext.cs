using Microsoft.EntityFrameworkCore;

namespace EventSourcing;

public class EventStoreDbContext(DbContextOptions<EventStoreDbContext> options) : DbContext(options)
{
    public DbSet<StoredEvent> Events => Set<StoredEvent>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<StoredEvent>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.EventId).IsRequired();
            entity.Property(e => e.EventType).IsRequired();
            entity.Property(e => e.Data).IsRequired();
            entity.Property(e => e.OccurredOn);
        });
    }
}
