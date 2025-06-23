using CQRS.Interfaces;
using MediatR;

namespace EventSourcing;

public class DomainEventPublisher(IPublisher mediator, IEventStore store) : IDomainEventPublisher
{
    private readonly IPublisher _mediator = mediator;
    private readonly IEventStore _store = store;

    public async Task Publish<T>(T domainEvent, CancellationToken cancellationToken = default) where T : IDomainEvent
    {
        await _store.PersistAsync(domainEvent, cancellationToken);
        await _mediator.Publish(domainEvent, cancellationToken);
    }
}
