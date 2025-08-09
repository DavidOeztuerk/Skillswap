using Microsoft.Extensions.DependencyInjection;
using UserService.Domain.Repositories;
using UserService.Infrastructure.Repositories;

namespace UserService.Infrastructure.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services)
    {
        // Repository registration
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IAuthRepository, AuthRepository>();
        services.AddScoped<ITwoFactorRepository, TwoFactorRepository>();
        services.AddScoped<IUserProfileRepository, UserProfileRepository>();
        services.AddScoped<IUserSkillsRepository, UserSkillsRepository>();
        services.AddScoped<IUserBlockingRepository, UserBlockingRepository>();
        services.AddScoped<IUserActivityRepository, UserActivityRepository>();
        services.AddScoped<IPermissionRepository, PermissionRepository>();

        // Permission service registration is handled in Application layer

        // Infrastructure services (these should be already registered by shared Infrastructure)
        // But we ensure they're available

        return services;
    }
}
