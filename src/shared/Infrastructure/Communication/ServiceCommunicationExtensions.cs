using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Configuration;
using Infrastructure.Resilience;

namespace Infrastructure.Communication;

public static class ServiceCommunicationExtensions
{
    public static IServiceCollection AddServiceCommunication(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddHttpClient<ServiceCommunicationManager>(client =>
        {
            client.Timeout = TimeSpan.FromSeconds(30);
            client.DefaultRequestHeaders.Add("User-Agent", "SkillSwap-ServiceCommunication/1.0");
        });

        services.AddScoped<IServiceCommunicationManager, ServiceCommunicationManager>();
        
        return services;
    }
}
