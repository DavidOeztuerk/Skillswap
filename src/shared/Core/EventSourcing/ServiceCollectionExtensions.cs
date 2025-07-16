using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace EventSourcing;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddEventSourcing(this IServiceCollection services, string? dbName = null)
    {
        services.AddDbContext<EventStoreDbContext>(options =>
            options.UseInMemoryDatabase(dbName ?? "EventStore"));
        services.AddScoped<IEventStore, EfEventStore>();
        services.AddScoped<IDomainEventPublisher, DomainEventPublisher>();
        services.AddScoped<EventReplayService>();
        return services;
    }
}
