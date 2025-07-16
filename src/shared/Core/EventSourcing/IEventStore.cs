using CQRS.Interfaces;

namespace EventSourcing;

public interface IEventStore
{
    Task PersistAsync(IDomainEvent domainEvent, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<IDomainEvent>> LoadAsync(DateTime? from = null, CancellationToken cancellationToken = default);
    Task ReplayAsync(Func<IDomainEvent, Task> handler, DateTime? from = null, CancellationToken cancellationToken = default);
}
