# Environment Management Strategy for Skillswap

## 🎯 Overview
This document outlines the comprehensive strategy for managing configurations across different deployment environments: Local Development, Docker, Staging, and Production.

## 📊 Environment Matrix

| Environment | Service Discovery | Database | Redis | RabbitMQ | Authentication |
|------------|-------------------|----------|--------|----------|----------------|
| Local | localhost:port | localhost:5432 | localhost:6379 | localhost:5672 | Local JWT |
| Docker | service-name:port | postgres:5432 | redis:6379 | rabbitmq:5672 | Docker JWT |
| Staging | Kubernetes DNS | Azure PostgreSQL | Azure Cache | Azure Service Bus | Azure AD B2C |
| Production | Kubernetes DNS | Azure PostgreSQL (HA) | Azure Cache (Premium) | Azure Service Bus | Azure AD B2C |

## 🏗️ Architecture Approach

### 1. Configuration Hierarchy
```
1. Default Configuration (appsettings.json)
   ↓
2. Environment-Specific (appsettings.{Environment}.json)
   ↓
3. Environment Variables
   ↓
4. Command Line Arguments
   ↓
5. Runtime Configuration (from Config Service)
```

### 2. Implementation Strategy

#### A. Configuration Files Structure
```
appsettings.json                 # Base configuration with smart defaults
appsettings.Development.json     # Local development overrides
appsettings.Docker.json          # Docker Compose overrides
appsettings.Staging.json         # Staging environment
appsettings.Production.json      # Production environment
```

#### B. Environment Variables Pattern
```bash
# Local Development (.env.local)
ASPNETCORE_ENVIRONMENT=Development
CONNECTION_STRATEGY=localhost
DB_HOST=localhost
DB_PORT=5432
DB_PASSWORD=DohoTyson@1990?!
REDIS_HOST=localhost
RABBITMQ_HOST=localhost

# Docker (.env.docker)
ASPNETCORE_ENVIRONMENT=Docker
CONNECTION_STRATEGY=docker
DB_HOST=postgres
REDIS_HOST=redis
RABBITMQ_HOST=rabbitmq

# Staging (.env.staging)
ASPNETCORE_ENVIRONMENT=Staging
CONNECTION_STRATEGY=azure
DB_CONNECTION_STRING=Server=skillswap-staging.postgres.database.azure.com...
REDIS_CONNECTION_STRING=skillswap-staging.redis.cache.windows.net...
SERVICE_BUS_CONNECTION_STRING=Endpoint=sb://skillswap-staging.servicebus.windows.net...

# Production (.env.production)
ASPNETCORE_ENVIRONMENT=Production
CONNECTION_STRATEGY=azure
DB_CONNECTION_STRING=Server=skillswap-prod.postgres.database.azure.com...
REDIS_CONNECTION_STRING=skillswap-prod.redis.cache.windows.net...
SERVICE_BUS_CONNECTION_STRING=Endpoint=sb://skillswap-prod.servicebus.windows.net...
```

## 🔧 Service Discovery Patterns

### 1. DNS-Based Discovery (Recommended)
```csharp
public class ServiceResolver
{
    private readonly IConfiguration _configuration;
    private readonly string _environment;

    public string ResolveServiceUrl(string serviceName)
    {
        return _environment switch
        {
            "Development" => $"http://localhost:{GetLocalPort(serviceName)}",
            "Docker" => $"http://{serviceName.ToLower()}:80",
            "Staging" => $"http://{serviceName.ToLower()}.skillswap-staging.svc.cluster.local",
            "Production" => $"http://{serviceName.ToLower()}.skillswap-prod.svc.cluster.local",
            _ => throw new NotSupportedException($"Environment {_environment} not supported")
        };
    }

    private int GetLocalPort(string serviceName) => serviceName switch
    {
        "UserService" => 5001,
        "SkillService" => 5002,
        "MatchmakingService" => 5003,
        "AppointmentService" => 5004,
        "NotificationService" => 5005,
        "VideocallService" => 5006,
        _ => throw new ArgumentException($"Unknown service: {serviceName}")
    };
}
```

### 2. Service Registry Pattern (Alternative)
```csharp
public interface IServiceRegistry
{
    Task<ServiceEndpoint> DiscoverAsync(string serviceName);
    Task RegisterAsync(string serviceName, ServiceEndpoint endpoint);
    Task<HealthStatus> HealthCheckAsync(string serviceName);
}

public class ServiceEndpoint
{
    public string Host { get; set; }
    public int Port { get; set; }
    public string Protocol { get; set; }
    public Dictionary<string, string> Metadata { get; set; }
}
```

### 3. Hybrid Approach (Flexible)
```csharp
public class HybridServiceDiscovery
{
    public async Task<string> ResolveAsync(string serviceName)
    {
        // 1. Check environment variable first
        var envUrl = Environment.GetEnvironmentVariable($"{serviceName.ToUpper()}_URL");
        if (!string.IsNullOrEmpty(envUrl)) return envUrl;

        // 2. Check configuration
        var configUrl = _configuration[$"Services:{serviceName}:Url"];
        if (!string.IsNullOrEmpty(configUrl)) return configUrl;

        // 3. Use DNS-based discovery
        return await _dnsResolver.ResolveAsync(serviceName);

        // 4. Fallback to service registry
        var endpoint = await _serviceRegistry.DiscoverAsync(serviceName);
        return $"{endpoint.Protocol}://{endpoint.Host}:{endpoint.Port}";
    }
}
```

## 🔐 Secrets Management

### Development
```json
// appsettings.Development.json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Database=skillswap_dev;Username=postgres;Password=DohoTyson@1990?!"
  },
  "JwtSettings": {
    "Secret": "development-secret-key-for-testing-only"
  }
}
```

### Docker
```yaml
# docker-compose.override.yml
services:
  userservice:
    environment:
      - ConnectionStrings__DefaultConnection=Host=postgres;Database=skillswap;Username=postgres;Password=${DB_PASSWORD}
      - JwtSettings__Secret=${JWT_SECRET}
```

### Staging/Production
```csharp
// Program.cs
builder.Configuration
    .AddAzureKeyVault(
        new Uri($"https://{keyVaultName}.vault.azure.net/"),
        new DefaultAzureCredential())
    .AddEnvironmentVariables();
```

## 📦 Container Configuration

### Dockerfile with Multi-Stage Build
```dockerfile
# Build stage
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
ARG BUILD_CONFIGURATION=Release
ARG ENVIRONMENT=Production
WORKDIR /src
COPY . .
RUN dotnet publish -c $BUILD_CONFIGURATION -o /app/publish

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
ARG ENVIRONMENT=Production
ENV ASPNETCORE_ENVIRONMENT=$ENVIRONMENT
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "ServiceName.dll"]
```

### Docker Compose Environment Management
```yaml
# docker-compose.yml (base)
version: '3.8'
services:
  gateway:
    image: skillswap/gateway
    ports:
      - "8080:80"

# docker-compose.override.yml (development)
version: '3.8'
services:
  gateway:
    environment:
      - ASPNETCORE_ENVIRONMENT=Docker
      - Services__UserService=http://userservice
      - Services__SkillService=http://skillservice

# docker-compose.staging.yml
version: '3.8'
services:
  gateway:
    environment:
      - ASPNETCORE_ENVIRONMENT=Staging
      - Services__UserService=${USER_SERVICE_URL}
      - Services__SkillService=${SKILL_SERVICE_URL}
```

## 🚀 Deployment Configuration

### Kubernetes ConfigMaps and Secrets
```yaml
# configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  ASPNETCORE_ENVIRONMENT: "Production"
  Services__UserService: "http://userservice.default.svc.cluster.local"
  
---
# secret.yaml
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
type: Opaque
data:
  JWT_SECRET: <base64-encoded-secret>
  DB_PASSWORD: <base64-encoded-password>
```

### Helm Values for Different Environments
```yaml
# values.yaml (default)
environment: development
replicaCount: 1

# values.staging.yaml
environment: staging
replicaCount: 2
ingress:
  host: staging.skillswap.com

# values.production.yaml
environment: production
replicaCount: 3
ingress:
  host: skillswap.com
resources:
  limits:
    cpu: 1000m
    memory: 512Mi
```

## 🔄 Migration Strategy

### Phase 1: Local Development (Current)
- All services use localhost
- Hardcoded ports in configuration
- Local PostgreSQL, Redis, RabbitMQ

### Phase 2: Docker Support
1. Add appsettings.Docker.json files
2. Implement ServiceResolver class
3. Update Gateway routing logic
4. Create docker-compose.override.yml

### Phase 3: Cloud Migration
1. Set up Azure resources (PostgreSQL, Redis, Service Bus)
2. Configure Azure Key Vault
3. Update CI/CD pipelines with environment-specific builds
4. Implement health checks and monitoring

### Phase 4: Production Hardening
1. Implement circuit breakers
2. Add distributed tracing
3. Set up centralized logging
4. Configure auto-scaling policies

## 📋 Implementation Checklist

### Immediate Actions
- [ ] Create ServiceResolver class in SharedLibrary
- [ ] Add environment detection logic to Program.cs
- [ ] Create appsettings.Docker.json files
- [ ] Update Gateway to use ServiceResolver

### Short-term Actions
- [ ] Implement IServiceDiscovery interface
- [ ] Add health check endpoints to all services
- [ ] Create environment-specific Dockerfiles
- [ ] Set up Azure Key Vault integration

### Long-term Actions
- [ ] Implement service mesh (Istio/Linkerd)
- [ ] Add distributed configuration service
- [ ] Implement feature flags system
- [ ] Set up A/B testing infrastructure

## 💡 Code Examples

### Dynamic Connection String Resolution
```csharp
public static class ConnectionStringResolver
{
    public static string Resolve(IConfiguration configuration, string name)
    {
        // 1. Check environment variable
        var envVar = Environment.GetEnvironmentVariable($"CONNECTIONSTRING__{name.ToUpper()}");
        if (!string.IsNullOrEmpty(envVar)) return envVar;

        // 2. Check if in Azure, use Managed Identity
        if (IsAzureEnvironment())
        {
            return GetAzureConnectionString(name);
        }

        // 3. Check configuration
        var configValue = configuration.GetConnectionString(name);
        if (!string.IsNullOrEmpty(configValue))
        {
            // Replace placeholders
            return configValue
                .Replace("{HOST}", GetHost())
                .Replace("{PASSWORD}", GetPassword());
        }

        // 4. Use default based on environment
        return GetDefaultConnectionString(name);
    }

    private static string GetHost()
    {
        return Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") switch
        {
            "Development" => "localhost",
            "Docker" => "postgres",
            _ => "managed-postgres.database.azure.com"
        };
    }
}
```

### Gateway Dynamic Routing
```csharp
public class DynamicRoutingMiddleware
{
    private readonly IServiceResolver _serviceResolver;
    
    public async Task InvokeAsync(HttpContext context)
    {
        var path = context.Request.Path.Value;
        var serviceName = ExtractServiceName(path);
        
        if (!string.IsNullOrEmpty(serviceName))
        {
            var serviceUrl = await _serviceResolver.ResolveAsync(serviceName);
            context.Items["ServiceUrl"] = serviceUrl;
        }
        
        await _next(context);
    }
}
```

### Environment-Aware Startup
```csharp
public class Program
{
    public static void Main(string[] args)
    {
        var builder = WebApplication.CreateBuilder(args);
        
        // Configure based on environment
        var environment = builder.Environment.EnvironmentName;
        
        builder.Configuration
            .AddJsonFile("appsettings.json", optional: false, reloadOnChange: true)
            .AddJsonFile($"appsettings.{environment}.json", optional: true, reloadOnChange: true)
            .AddEnvironmentVariables()
            .AddCommandLine(args);
        
        // Add environment-specific services
        if (environment == "Development")
        {
            builder.Services.AddSingleton<IServiceResolver, LocalServiceResolver>();
        }
        else if (environment == "Docker")
        {
            builder.Services.AddSingleton<IServiceResolver, DockerServiceResolver>();
        }
        else
        {
            builder.Services.AddSingleton<IServiceResolver, KubernetesServiceResolver>();
        }
        
        var app = builder.Build();
        
        // Configure pipeline based on environment
        if (app.Environment.IsDevelopment())
        {
            app.UseDeveloperExceptionPage();
        }
        else
        {
            app.UseExceptionHandler("/error");
            app.UseHsts();
        }
        
        app.Run();
    }
}
```

## 🔍 Monitoring and Debugging

### Environment Detection Endpoint
```csharp
[ApiController]
[Route("api/[controller]")]
public class EnvironmentController : ControllerBase
{
    [HttpGet("info")]
    public IActionResult GetEnvironmentInfo()
    {
        return Ok(new
        {
            Environment = _environment.EnvironmentName,
            MachineName = Environment.MachineName,
            IsDocker = File.Exists("/.dockerenv"),
            IsKubernetes = !string.IsNullOrEmpty(Environment.GetEnvironmentVariable("KUBERNETES_SERVICE_HOST")),
            Configuration = new
            {
                DatabaseHost = _configuration["Database:Host"],
                RedisHost = _configuration["Redis:Host"],
                RabbitMQHost = _configuration["RabbitMQ:Host"]
            }
        });
    }
}
```

### Health Check with Environment Info
```csharp
public class EnvironmentHealthCheck : IHealthCheck
{
    public Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken cancellationToken = default)
    {
        var data = new Dictionary<string, object>
        {
            ["environment"] = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Unknown",
            ["connection_strategy"] = Environment.GetEnvironmentVariable("CONNECTION_STRATEGY") ?? "default",
            ["is_containerized"] = File.Exists("/.dockerenv")
        };

        return Task.FromResult(HealthCheckResult.Healthy("Environment configured", data));
    }
}
```

## 📝 Best Practices

1. **Never hardcode environment-specific values** - Always use configuration or environment variables
2. **Use smart defaults** - Services should work with minimal configuration
3. **Fail fast** - If critical configuration is missing, fail immediately with clear error
4. **Log configuration sources** - Always log where configuration values came from
5. **Validate configuration** - Use options pattern with validation
6. **Keep secrets secret** - Never log sensitive configuration values
7. **Document requirements** - Clearly document required vs optional configuration
8. **Test all environments** - Have automated tests for each environment configuration
9. **Version configuration** - Track configuration changes in source control
10. **Monitor configuration drift** - Alert when configuration differs from expected

## 🚨 Common Pitfalls to Avoid

1. **Hardcoding localhost in service code** - Use configuration instead
2. **Assuming service names** - Use service discovery
3. **Mixing concerns** - Keep environment logic separate from business logic
4. **Forgetting CORS in production** - Configure properly for each environment
5. **Using development secrets in production** - Rotate secrets per environment
6. **Not handling configuration failures** - Always have fallbacks
7. **Ignoring case sensitivity** - Environment variables are case-sensitive in Linux
8. **Forgetting to update all services** - Keep configurations synchronized
9. **Not testing configuration changes** - Test in staging before production
10. **Overcomplicating** - Start simple, add complexity only when needed

---

This strategy provides a clear path from local development to production deployment while maintaining flexibility and security across all environments.