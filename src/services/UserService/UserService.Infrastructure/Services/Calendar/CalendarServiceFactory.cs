using Microsoft.Extensions.DependencyInjection;
using UserService.Domain.Models;
using UserService.Domain.Services;

namespace UserService.Infrastructure.Services.Calendar;

public class CalendarServiceFactory : ICalendarServiceFactory
{
    private readonly IServiceProvider _serviceProvider;
    private readonly Dictionary<string, Type> _serviceTypes;

    public CalendarServiceFactory(IServiceProvider serviceProvider)
    {
        _serviceProvider = serviceProvider;
        _serviceTypes = new Dictionary<string, Type>(StringComparer.OrdinalIgnoreCase)
        {
            [CalendarProviders.Google] = typeof(GoogleCalendarService),
            [CalendarProviders.Microsoft] = typeof(MicrosoftCalendarService),
            [CalendarProviders.Apple] = typeof(AppleCalendarService)
        };
    }

    public ICalendarService GetService(string provider)
    {
        if (!_serviceTypes.TryGetValue(provider, out var serviceType))
        {
            throw new ArgumentException($"Unsupported calendar provider: {provider}. Supported providers: {string.Join(", ", CalendarProviders.All)}");
        }

        return (ICalendarService)_serviceProvider.GetRequiredService(serviceType);
    }

    public IEnumerable<string> GetSupportedProviders() => CalendarProviders.All;
}
