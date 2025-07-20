using Contracts.Mappers.Contracts.Mapping.Contracts.Mapping.Contracts.Mapping;
using Contracts.User.Requests;
using Contracts.User.Responses;
using Microsoft.Extensions.DependencyInjection;
using System.Reflection;
using AutoMapper;

namespace Contracts.Mappers;

public static class ContractMappingExtensions
{
    /// <summary>
    /// Adds contract mapping profiles to the service collection
    /// </summary>
    public static IServiceCollection AddContractMapping(this IServiceCollection services, params Assembly[] assemblies)
    {
        services.AddAutoMapper(config =>
        {
            config.AddMaps(assemblies);
            config.AddProfile<CommonMappingProfile>();
        }, assemblies);

        // Register mapper factories
        services.AddScoped(typeof(IContractMapper<,>), typeof(GenericContractMapper<,>));
        services.AddScoped(typeof(IContractMapper<,,,>), typeof(GenericContractMapper<,,,>));

        return services;
    }
}
