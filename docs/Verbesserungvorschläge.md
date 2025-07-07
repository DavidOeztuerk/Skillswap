# Shared Ordner - Verbesserungsvorschläge

## 🔍 Analyse der aktuellen Shared-Struktur

### ✅ **Was bereits sehr gut ist:**
- **CQRS Implementation**: Saubere Trennung, Pipeline Behaviors
- **Infrastructure**: Umfassende Middleware, Security, Models
- **Event Sourcing**: Domain Events mit Replay-Mechanismus
- **Security**: JWT, Rollen, Permissions, Policies
- **Error Handling**: Globale Exception Middleware

---

## 🔧 Verbesserungsvorschläge

### 1. **CQRS - Fehlende Abstractions**

#### **Problem**: 
```csharp
// Aktuell: Jeder Handler muss manuell Success/Error erstellen
protected ApiResponse<TResponse> Success(TResponse data, string? message = null)
protected ApiResponse<TResponse> Error(string error)
```

#### **Verbesserung**: Result Pattern + Mapping
```csharp
// Neues Result Pattern
public abstract record Result
{
    public record Success<T>(T Data, string? Message = null) : Result;
    public record Error(string Message, List<string>? Details = null) : Result;
    public record NotFound(string? Message = null) : Result;
    public record Unauthorized(string? Message = null) : Result;
    public record Forbidden(string? Message = null) : Result;
}

// Auto-Mapping Extension
public static class ResultExtensions
{
    public static ApiResponse<T> ToApiResponse<T>(this Result<T> result) =>
        result switch
        {
            Result.Success<T> success => ApiResponse<T>.SuccessResult(success.Data, success.Message),
            Result.Error error => ApiResponse<T>.ErrorResult(error.Message),
            Result.NotFound => ApiResponse<T>.NotFoundResult(),
            _ => ApiResponse<T>.ErrorResult("Unknown error")
        };
}
```

### 2. **Infrastructure - Cache Invalidation fehlt**

#### **Problem**: 
```csharp
// CachingBehavior.cs - Nur Caching, keine Invalidierung
public class CachingBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
{
    // Nur Get/Set, aber kein Cache-Clearing bei Updates
}
```

#### **Verbesserung**: Cache Invalidation Strategy
```csharp
// Neues Interface
public interface ICacheInvalidation
{
    List<string> GetInvalidationKeys();
}

// Commands können Cache invalidieren
public record UpdateUserCommand(...) : ICommand<UpdateUserResponse>, ICacheInvalidation
{
    public List<string> GetInvalidationKeys() => 
        new() { $"user-profile:{UserId}", $"user-roles:{UserId}" };
}

// Cache Invalidation Behavior
public class CacheInvalidationBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
{
    public async Task<TResponse> Handle(TRequest request, RequestHandlerDelegate<TResponse> next, ...)
    {
        var response = await next();
        
        if (request is ICacheInvalidation invalidation && response.Success)
        {
            foreach (var key in invalidation.GetInvalidationKeys())
            {
                await _cache.RemoveAsync(key);
            }
        }
        
        return response;
    }
}
```

### 3. **Security - Permission Mapping fehlt**

#### **Problem**: 
```csharp
// GetPermissionsForRole() ist hardcoded in QueryHandler
private static List<string> GetPermissionsForRole(string role)
{
    return role switch
    {
        "SuperAdmin" => new List<string> { "users:read", "users:write", ... },
        // Hardcoded mapping
    };
}
```

#### **Verbesserung**: Flexible Permission Configuration
```csharp
// Neue Permission Configuration
public class PermissionConfiguration
{
    public Dictionary<string, List<string>> RolePermissions { get; set; } = new()
    {
        [Roles.User] = new() { Permissions.ReadSkills, Permissions.WriteSkills },
        [Roles.Admin] = new() { Permissions.ReadUsers, Permissions.WriteUsers, ... }
    };
    
    public List<string> GetPermissionsForRole(string role) =>
        RolePermissions.GetValueOrDefault(role, new List<string>());
}

// Service Extension
services.Configure<PermissionConfiguration>(configuration.GetSection("Permissions"));
services.AddSingleton<IPermissionService, PermissionService>();
```

### 4. **Event Sourcing - Snapshot Support fehlt**

#### **Problem**: 
```csharp
// EfEventStore.cs - Lädt ALLE Events bei Replay
public async Task<IReadOnlyList<IDomainEvent>> LoadAsync(DateTime? from = null, ...)
{
    var events = await query.OrderBy(e => e.OccurredOn).ToListAsync(cancellationToken);
    // Kann bei vielen Events sehr langsam werden
}
```

#### **Verbesserung**: Snapshot Pattern
```csharp
// Snapshot Entity
public class EventSnapshot
{
    public string AggregateId { get; set; }
    public string SnapshotData { get; set; }
    public long LastEventSequence { get; set; }
    public DateTime CreatedAt { get; set; }
}

// Erweiterte Load-Methode
public async Task<IReadOnlyList<IDomainEvent>> LoadAsync(string aggregateId, long? fromSequence = null)
{
    // 1. Neuesten Snapshot laden
    var snapshot = await GetLatestSnapshotAsync(aggregateId);
    
    // 2. Nur Events nach Snapshot laden
    var fromSequence = snapshot?.LastEventSequence ?? 0;
    var events = await LoadEventsFromSequenceAsync(aggregateId, fromSequence);
    
    return events;
}
```

### 5. **Models - Fehlende Validation Attributes**

#### **Problem**: 
```csharp
// ApiResponse.cs - Keine Validation für Standard-Response-Felder
public class ApiResponse<T>
{
    public bool Success { get; set; }
    public T? Data { get; set; }
    public string? Message { get; set; }
    // Keine Validation Rules
}
```

#### **Verbesserung**: Response Validation + Consistency
```csharp
// Validierte Response Models
public class ApiResponse<T>
{
    [Required]
    public bool Success { get; init; }
    
    public T? Data { get; init; }
    
    [MaxLength(500)]
    public string? Message { get; init; }
    
    [MaxLength(50)]
    public List<string>? Errors { get; init; }
    
    public DateTime Timestamp { get; init; } = DateTime.UtcNow;
    
    // Validation: Success=true requires Data, Success=false requires Errors
    public bool IsValid => Success ? Data != null : Errors?.Count > 0;
}
```

### 6. **Middleware - Request/Response Correlation fehlt**

#### **Problem**: 
```csharp
// RequestLoggingMiddleware.cs - Logs Request und Response separat
private async Task LogRequestAsync(HttpContext context) { }
private async Task LogResponseAsync(HttpContext context, ...) { }
// Keine Verbindung zwischen Request und Response Logs
```

#### **Verbesserung**: Structured Request-Response Correlation
```csharp
// Request-Response Correlation
public class RequestResponseCorrelation
{
    public string CorrelationId { get; set; }
    public DateTime StartTime { get; set; }
    public HttpRequest Request { get; set; }
    public HttpResponse Response { get; set; }
    public TimeSpan Duration { get; set; }
    public Exception? Exception { get; set; }
}

// Enhanced Logging Middleware
public async Task InvokeAsync(HttpContext context)
{
    var correlation = new RequestResponseCorrelation
    {
        CorrelationId = context.GetCorrelationId(),
        StartTime = DateTime.UtcNow,
        Request = CaptureRequest(context.Request)
    };
    
    try
    {
        await _next(context);
        correlation.Response = CaptureResponse(context.Response);
    }
    catch (Exception ex)
    {
        correlation.Exception = ex;
        throw;
    }
    finally
    {
        correlation.Duration = DateTime.UtcNow - correlation.StartTime;
        _logger.LogInformation("Request completed: {@Correlation}", correlation);
    }
}
```

### 7. **Extensions - Service Health Checks fehlen**

#### **Problem**: 
```csharp
// ServiceCollectionExtensions.cs - Grundlegende Health Checks
services.AddHealthChecks();
// Keine spezifischen Checks für Dependencies
```

#### **Verbesserung**: Comprehensive Health Checks
```csharp
// Enhanced Health Checks
public static IServiceCollection AddSkillSwapHealthChecks(
    this IServiceCollection services, 
    IConfiguration configuration)
{
    services.AddHealthChecks()
        .AddDbContextCheck<UserDbContext>("database")
        .AddRedis(configuration.GetConnectionString("Redis"), "redis")
        .AddRabbitMQ(configuration.GetConnectionString("RabbitMQ"), "messagebus")
        .AddCheck<CustomServiceHealthCheck>("userservice")
        .AddCheck<MemoryHealthCheck>("memory")
        .AddCheck<DiskSpaceHealthCheck>("diskspace");
        
    return services;
}

// Custom Health Check
public class CustomServiceHealthCheck : IHealthCheck
{
    public async Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, ...)
    {
        try
        {
            // Check critical dependencies
            await CheckDatabaseConnection();
            await CheckExternalServices();
            
            return HealthCheckResult.Healthy("Service is healthy");
        }
        catch (Exception ex)
        {
            return HealthCheckResult.Unhealthy("Service is unhealthy", ex);
        }
    }
}
```

---

## 📋 Prioritätenliste der Verbesserungen

### **🔴 Hoch (Performance & Stabilität)**
1. **Cache Invalidation Strategy** - Verhindert stale data
2. **Event Sourcing Snapshots** - Performance bei vielen Events
3. **Enhanced Health Checks** - Bessere Systemüberwachung

### **🟡 Mittel (Developer Experience)**
4. **Result Pattern** - Sauberer Error Handling
5. **Permission Configuration** - Flexiblere Rechteverwaltung
6. **Request-Response Correlation** - Bessere Debugging

### **🟢 Niedrig (Nice-to-have)**
7. **Response Validation** - Konsistenz-Checks

---

## 🎯 Fazit

Die **Shared-Ordner Struktur ist bereits sehr solid**, aber diese Verbesserungen würden die **Performance, Maintainability und Developer Experience** deutlich verbessern, besonders bei steigender Komplexität und Nutzerzahl.