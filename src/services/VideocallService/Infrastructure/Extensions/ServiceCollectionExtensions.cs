using System.Reflection;
using CQRS.Extensions;
using EventSourcing;
using Infrastructure.Authorization;
using Infrastructure.Extensions;
using Infrastructure.Security;
using VideocallService.Infrastructure.HttpClients;

namespace VideocallService.Infrastructure.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration, IWebHostEnvironment environment, string serviceName)
    {
        // Register service clients that use IServiceCommunicationManager
        services.AddScoped<IUserServiceClient, UserServiceClient>();
        services.AddScoped<IAppointmentServiceClient, AppointmentServiceClient>();
        services.AddScoped<INotificationServiceClient, NotificationServiceClient>();

        services.AddSharedInfrastructure(configuration, environment, serviceName);

        services.AddJwtAuthentication(configuration);

        services.AddDatabaseContext<VideoCallDbContext>(
            configuration, 
            serviceName);

        services.AddEventSourcing("VideocallServiceEventStore");

        services.AddCQRS(Assembly.GetExecutingAssembly());

        services.AddMessaging(
            configuration,
            Assembly.GetExecutingAssembly());

        services.AddSignalR(options =>
        {
            options.EnableDetailedErrors = environment.IsDevelopment();
            options.MaximumReceiveMessageSize = 1024 * 1024; 
            options.StreamBufferCapacity = 10;
        });

        services.AddEventBus();

        services.AddSkillSwapAuthorization();
        services.AddPermissionAuthorization();
        services.AddAuthorization(options => options.AddPermissionPolicies());

        return services;
    }
}
