using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using MassTransit;
using Infrastructure.Resilience;

namespace Infrastructure.Communication;

public class ServiceCommunicationManager : IServiceCommunicationManager
{
    private readonly HttpClient _httpClient;
    private readonly IPublishEndpoint _publishEndpoint;
    private readonly ILogger<ServiceCommunicationManager> _logger;
    private readonly IConfiguration _configuration;
    private readonly ICircuitBreaker? _circuitBreaker;
    private readonly Dictionary<string, string> _serviceUrls;
    private readonly JsonSerializerOptions _jsonOptions;

    public ServiceCommunicationManager(
        HttpClient httpClient,
        IPublishEndpoint publishEndpoint,
        ILogger<ServiceCommunicationManager> logger,
        IConfiguration configuration,
        ICircuitBreakerFactory? circuitBreakerFactory = null)
    {
        _httpClient = httpClient;
        _publishEndpoint = publishEndpoint;
        _logger = logger;
        _configuration = configuration;
        _circuitBreaker = circuitBreakerFactory?.GetCircuitBreaker("ServiceCommunication");
        
        _serviceUrls = InitializeServiceUrls();
        _jsonOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            PropertyNameCaseInsensitive = true
        };
    }

    public async Task<TResponse?> SendRequestAsync<TRequest, TResponse>(
        string serviceName,
        string endpoint,
        TRequest request,
        CancellationToken cancellationToken = default,
        Dictionary<string, string>? headers = null)
        where TRequest : class
        where TResponse : class
    {
        if (!_serviceUrls.TryGetValue(serviceName.ToLowerInvariant(), out var baseUrl))
        {
            _logger.LogError("Service {ServiceName} not found in configuration", serviceName);
            throw new InvalidOperationException($"Service {serviceName} not configured");
        }

        var requestUri = $"{baseUrl.TrimEnd('/')}/{endpoint.TrimStart('/')}";
        
        return await _circuitBreaker.ExecuteAsync(async () =>
        {
            try
            {
                using var httpRequest = new HttpRequestMessage(HttpMethod.Post, requestUri)
                {
                    Content = JsonContent.Create(request, options: _jsonOptions)
                };

                if (headers != null)
                {
                    foreach (var header in headers)
                    {
                        httpRequest.Headers.Add(header.Key, header.Value);
                    }
                }

                _logger.LogDebug("Sending request to {ServiceName} at {RequestUri}", serviceName, requestUri);
                
                using var response = await _httpClient.SendAsync(httpRequest, cancellationToken);
                
                if (response.IsSuccessStatusCode)
                {
                    var result = await response.Content.ReadFromJsonAsync<TResponse>(_jsonOptions, cancellationToken);
                    _logger.LogDebug("Successfully received response from {ServiceName}", serviceName);
                    return result;
                }
                
                var errorContent = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogWarning("Request to {ServiceName} failed with status {StatusCode}: {Error}", 
                    serviceName, response.StatusCode, errorContent);
                
                return default;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error communicating with {ServiceName} at {RequestUri}", serviceName, requestUri);
                throw;
            }
        });
    }

    public async Task PublishEventAsync<TEvent>(TEvent eventData, CancellationToken cancellationToken = default)
        where TEvent : class
    {
        try
        {
            _logger.LogDebug("Publishing event of type {EventType}", typeof(TEvent).Name);
            await _publishEndpoint.Publish(eventData, cancellationToken);
            _logger.LogDebug("Successfully published event of type {EventType}", typeof(TEvent).Name);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to publish event of type {EventType}", typeof(TEvent).Name);
            throw;
        }
    }

    public async Task<bool> CheckServiceHealthAsync(string serviceName, CancellationToken cancellationToken = default)
    {
        if (!_serviceUrls.TryGetValue(serviceName.ToLowerInvariant(), out var baseUrl))
        {
            return false;
        }

        var healthEndpoint = $"{baseUrl.TrimEnd('/')}/health/ready";
        
        try
        {
            using var response = await _httpClient.GetAsync(healthEndpoint, cancellationToken);
            var isHealthy = response.IsSuccessStatusCode;
            
            _logger.LogDebug("Health check for {ServiceName}: {Status}", 
                serviceName, isHealthy ? "Healthy" : "Unhealthy");
            
            return isHealthy;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Health check failed for {ServiceName}", serviceName);
            return false;
        }
    }

    public async Task<Dictionary<string, ServiceEndpointInfo>> DiscoverServiceEndpointsAsync(
        string serviceName,
        CancellationToken cancellationToken = default)
    {
        if (!_serviceUrls.TryGetValue(serviceName.ToLowerInvariant(), out var baseUrl))
        {
            return new Dictionary<string, ServiceEndpointInfo>();
        }

        try
        {
            var discoveryEndpoint = $"{baseUrl.TrimEnd('/')}/swagger/v1/swagger.json";
            using var response = await _httpClient.GetAsync(discoveryEndpoint, cancellationToken);
            
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Service discovery failed for {ServiceName}", serviceName);
                return new Dictionary<string, ServiceEndpointInfo>();
            }

            var swaggerDoc = await response.Content.ReadFromJsonAsync<JsonDocument>(_jsonOptions, cancellationToken);
            var endpoints = ParseSwaggerDocument(swaggerDoc);
            
            _logger.LogDebug("Discovered {EndpointCount} endpoints for {ServiceName}", 
                endpoints.Count, serviceName);
            
            return endpoints;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to discover endpoints for {ServiceName}", serviceName);
            return new Dictionary<string, ServiceEndpointInfo>();
        }
    }

    private Dictionary<string, string> InitializeServiceUrls()
    {
        var services = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        
        var serviceConfig = _configuration.GetSection("Services");
        
        services["userservice"] = serviceConfig["UserService:BaseUrl"] ?? "http://userservice:5001";
        services["skillservice"] = serviceConfig["SkillService:BaseUrl"] ?? "http://skillservice:5002";
        services["matchmakingservice"] = serviceConfig["MatchmakingService:BaseUrl"] ?? "http://matchmakingservice:5003";
        services["appointmentservice"] = serviceConfig["AppointmentService:BaseUrl"] ?? "http://appointmentservice:5004";
        services["videocallservice"] = serviceConfig["VideocallService:BaseUrl"] ?? "http://videocallservice:5005";
        services["notificationservice"] = serviceConfig["NotificationService:BaseUrl"] ?? "http://notificationservice:5006";
        services["gateway"] = serviceConfig["Gateway:BaseUrl"] ?? "http://gateway:8080";
        
        return services;
    }

    private static Dictionary<string, ServiceEndpointInfo> ParseSwaggerDocument(JsonDocument? swaggerDoc)
    {
        var endpoints = new Dictionary<string, ServiceEndpointInfo>();
        
        if (swaggerDoc?.RootElement.TryGetProperty("paths", out var pathsElement) == true)
        {
            foreach (var path in pathsElement.EnumerateObject())
            {
                foreach (var method in path.Value.EnumerateObject())
                {
                    var endpointKey = $"{method.Name.ToUpperInvariant()} {path.Name}";
                    var requiresAuth = CheckIfRequiresAuth(method.Value);
                    var metadata = ExtractMetadata(method.Value);
                    
                    endpoints[endpointKey] = new ServiceEndpointInfo(
                        endpointKey,
                        path.Name,
                        method.Name.ToUpperInvariant(),
                        requiresAuth,
                        metadata
                    );
                }
            }
        }
        
        return endpoints;
    }

    private static bool CheckIfRequiresAuth(JsonElement methodElement)
    {
        return methodElement.TryGetProperty("security", out _);
    }

    private static Dictionary<string, string> ExtractMetadata(JsonElement methodElement)
    {
        var metadata = new Dictionary<string, string>();
        
        if (methodElement.TryGetProperty("summary", out var summary))
        {
            metadata["summary"] = summary.GetString() ?? "";
        }
        
        if (methodElement.TryGetProperty("tags", out var tags) && tags.ValueKind == JsonValueKind.Array)
        {
            var tagList = tags.EnumerateArray().Select(t => t.GetString() ?? "").ToList();
            metadata["tags"] = string.Join(", ", tagList);
        }
        
        return metadata;
    }
}
