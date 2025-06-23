using MediatR;

namespace EventSourcing;

public class EventReplayService(IEventStore store, IPublisher publisher)
{
    private readonly IEventStore _store = store;
    private readonly IPublisher _publisher = publisher;

    public async Task ReplayAsync(DateTime? from = null, CancellationToken cancellationToken = default)
    {
        await _store.ReplayAsync(e => _publisher.Publish(e, cancellationToken), from, cancellationToken);
    }
}
