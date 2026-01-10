using Microsoft.EntityFrameworkCore;
using PaymentService.Domain.Entities;

namespace PaymentService.Infrastructure.Data;

public class PaymentDbContext(DbContextOptions<PaymentDbContext> options) : DbContext(options)
{
    public virtual DbSet<Payment> Payments => Set<Payment>();
    public virtual DbSet<PaymentProduct> PaymentProducts => Set<PaymentProduct>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(PaymentDbContext).Assembly);

        // Seed Boost Products
        modelBuilder.Entity<PaymentProduct>().HasData(
            new PaymentProduct
            {
                Id = "prod_hochschieben_7",
                Name = "Hochschieben",
                Description = "Dein Listing wird wieder auf Seite 1 angezeigt",
                ProductType = "ListingBoost",
                BoostType = "Refresh",
                Price = 3.99m,
                Currency = "EUR",
                DurationDays = 7,
                IsActive = true,
                SortOrder = 1,
                CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            },
            new PaymentProduct
            {
                Id = "prod_highlight_7",
                Name = "Highlight",
                Description = "Dein Listing wird farblich hervorgehoben",
                ProductType = "ListingBoost",
                BoostType = "Highlight",
                Price = 6.99m,
                Currency = "EUR",
                DurationDays = 7,
                IsActive = true,
                SortOrder = 2,
                CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            },
            new PaymentProduct
            {
                Id = "prod_top_7",
                Name = "Top-Anzeige",
                Description = "Dein Listing erscheint in den ersten 2 Plätzen",
                ProductType = "ListingBoost",
                BoostType = "TopListing",
                Price = 16.99m,
                Currency = "EUR",
                DurationDays = 7,
                IsActive = true,
                SortOrder = 3,
                CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            },
            new PaymentProduct
            {
                Id = "prod_galerie_10",
                Name = "Galerie",
                Description = "Dein Listing erscheint in der Homepage-Galerie",
                ProductType = "ListingBoost",
                BoostType = "Gallery",
                Price = 24.99m,
                Currency = "EUR",
                DurationDays = 10,
                IsActive = true,
                SortOrder = 4,
                CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            }
        );
    }
}
