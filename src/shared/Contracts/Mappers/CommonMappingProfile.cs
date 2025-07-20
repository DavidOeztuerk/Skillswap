using AutoMapper;

namespace Contracts.Mappers;

/// <summary>
/// Common mapping configurations
/// </summary>
public class CommonMappingProfile : Profile
{
    public CommonMappingProfile()
    {
        // Common mappings that can be reused across services
        CreateMap<DateTime, DateTime>()
            .ConvertUsing(dt => DateTime.SpecifyKind(dt, DateTimeKind.Utc));

        CreateMap<string?, string?>()
            .ConvertUsing((src, dest) => string.IsNullOrWhiteSpace(src) ? null : src.Trim());

        // Add common value conversions
        CreateMap<Dictionary<string, object>, Dictionary<string, string>>()
            .ConvertUsing(src => src.ToDictionary(
                kvp => kvp.Key,
                kvp => kvp.Value?.ToString() ?? string.Empty));
    }
}
