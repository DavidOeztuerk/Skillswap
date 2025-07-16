using CQRS.Interfaces;

namespace EventSourcing;

public interface IDomainEventPublisher
{
    Task Publish<T>(T domainEvent, CancellationToken cancellationToken = default) where T : IDomainEvent;
}
