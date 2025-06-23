using System.Text.Json;
using CQRS.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EventSourcing;

public class EfEventStore(EventStoreDbContext dbContext) : IEventStore
{
    private readonly EventStoreDbContext _dbContext = dbContext;

    public async Task PersistAsync(IDomainEvent domainEvent, CancellationToken cancellationToken = default)
    {
        var storedEvent = new StoredEvent
        {
            Id = Guid.NewGuid(),
            EventId = domainEvent.EventId,
            EventType = domainEvent.GetType().AssemblyQualifiedName ?? domainEvent.GetType().FullName!,
            Data = JsonSerializer.Serialize(domainEvent, domainEvent.GetType()),
            OccurredOn = domainEvent.OccurredOn
        };

        _dbContext.Events.Add(storedEvent);
        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<IDomainEvent>> LoadAsync(DateTime? from = null, CancellationToken cancellationToken = default)
    {
        var query = _dbContext.Events.AsNoTracking();
        if (from != null)
        {
            query = query.Where(e => e.OccurredOn >= from.Value);
        }

        var events = await query.OrderBy(e => e.OccurredOn).ToListAsync(cancellationToken);
        return events.Select(e => Deserialize(e.EventType, e.Data)).ToList();
    }

    public async Task ReplayAsync(Func<IDomainEvent, Task> handler, DateTime? from = null, CancellationToken cancellationToken = default)
    {
        var events = await LoadAsync(from, cancellationToken);
        foreach (var domainEvent in events)
        {
            await handler(domainEvent);
        }
    }

    private static IDomainEvent Deserialize(string typeName, string json)
    {
        var type = Type.GetType(typeName) ?? throw new InvalidOperationException($"Unknown event type: {typeName}");
        return (IDomainEvent)(JsonSerializer.Deserialize(json, type) ?? throw new InvalidOperationException("Deserialization failed"));
    }
}
