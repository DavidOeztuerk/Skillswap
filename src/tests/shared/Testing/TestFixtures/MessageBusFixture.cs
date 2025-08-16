using MassTransit;
using Microsoft.Extensions.DependencyInjection;
using Testcontainers.RabbitMq;
using Xunit;

namespace Testing.TestFixtures;

public class MessageBusFixture : IAsyncLifetime
{
    private RabbitMqContainer? _rabbitMqContainer;
    public string ConnectionString { get; private set; } = string.Empty;

    public async Task InitializeAsync()
    {
        _rabbitMqContainer = new RabbitMqBuilder()
            .WithImage("rabbitmq:3-management-alpine")
            .WithUsername("test")
            .WithPassword("test123")
            .Build();

        await _rabbitMqContainer.StartAsync();
        ConnectionString = _rabbitMqContainer.GetConnectionString();
    }

    public async Task DisposeAsync()
    {
        if (_rabbitMqContainer != null)
        {
            await _rabbitMqContainer.StopAsync();
            await _rabbitMqContainer.DisposeAsync();
        }
    }

    public void ConfigureMassTransit(IServiceCollection services, Action<IBusRegistrationConfigurator>? configure = null)
    {
        services.AddMassTransit(x =>
        {
            configure?.Invoke(x);
            
            x.SetKebabCaseEndpointNameFormatter();

            x.UsingRabbitMq((context, cfg) =>
            {
                cfg.Host(ConnectionString);
            });
        });
    }

    public async Task<ISendEndpoint> GetSendEndpointAsync(IBus bus, string queueName)
    {
        var uri = new Uri($"queue:{queueName}");
        return await bus.GetSendEndpoint(uri);
    }
}

[CollectionDefinition("MessageBus")]
public class MessageBusCollection : ICollectionFixture<MessageBusFixture>
{
}