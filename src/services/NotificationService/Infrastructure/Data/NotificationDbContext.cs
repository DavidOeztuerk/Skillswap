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
    public DbSet<NotificationMetadata> NotificationMetadata { get; set; }
    public DbSet<EmailTemplate> EmailTemplates { get; internal set; }
}
