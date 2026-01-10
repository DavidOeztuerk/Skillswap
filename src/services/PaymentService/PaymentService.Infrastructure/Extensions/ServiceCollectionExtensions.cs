using System.Reflection;
using Infrastructure.Extensions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.AspNetCore.Hosting;
using PaymentService.Application.Services;
using PaymentService.Domain.Repositories;
using PaymentService.Infrastructure.Data;
using PaymentService.Infrastructure.Repositories;
using PaymentService.Infrastructure.Services;
using CQRS.Extensions;
using Infrastructure.Security;
using Infrastructure.Authorization;

namespace PaymentService.Infrastructure.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration,
        IWebHostEnvironment environment,
        string serviceName)
    {
        // Unit of Work & Repositories
        services.AddScoped<IPaymentUnitOfWork, PaymentUnitOfWork>();
        services.AddScoped<IPaymentRepository, PaymentRepository>();
        services.AddScoped<IPaymentProductRepository, PaymentProductRepository>();

        // Stripe Service
        services.Configure<StripeSettings>(configuration.GetSection(StripeSettings.SectionName));
        services.AddScoped<IStripeService, StripeService>();

        // Shared Infrastructure (Caching, Security, Health Checks, etc.)
        services.AddSharedInfrastructure(configuration, environment, serviceName);

        // JWT Authentication
        services.AddJwtAuthentication(configuration, environment);

        // Database
        services.AddDatabaseContext<PaymentDbContext>(
            configuration,
            serviceName,
            "PaymentService.Infrastructure");

        // CQRS (MediatR)
        var applicationAssembly = Assembly.Load("PaymentService.Application");
        services.AddCQRS(applicationAssembly);

        // MassTransit Messaging
        services.AddMessaging(configuration, applicationAssembly);
        services.AddEventBus();

        // Authorization
        services.AddSkillSwapAuthorization();
        services.AddPermissionAuthorization();

        return services;
    }
}
