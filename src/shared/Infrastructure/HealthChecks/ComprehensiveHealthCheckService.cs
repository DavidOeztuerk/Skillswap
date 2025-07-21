// using System.Diagnostics;
// using Microsoft.Extensions.Logging;
// using Microsoft.Extensions.Configuration;
// using Infrastructure.Communication;
// using Contracts.System.Responses;
// using StackExchange.Redis;
// using Microsoft.EntityFrameworkCore;

// namespace Infrastructure.HealthChecks;

// public class ComprehensiveHealthCheckService : IComprehensiveHealthCheckService
// {
//     private readonly IServiceCommunicationManager _serviceCommunication;
//     private readonly ILogger<ComprehensiveHealthCheckService> _logger;
//     private readonly IConfiguration _configuration;
//     private readonly Dictionary<string, Func<CancellationToken, Task<HealthCheckResult>>> _customChecks;
//     private readonly string[] _knownServices = 
//     {
//         "userservice", "skillservice", "matchmakingservice", 
//         "appointmentservice", "videocallservice", "notificationservice"
//     };

//     public ComprehensiveHealthCheckService(
//         IServiceCommunicationManager serviceCommunication,
//         ILogger<ComprehensiveHealthCheckService> logger,
//         IConfiguration configuration)
//     {
//         _serviceCommunication = serviceCommunication;
//         _logger = logger;
//         _configuration = configuration;
//         _customChecks = new Dictionary<string, Func<CancellationToken, Task<HealthCheckResult>>>();
        
//         RegisterDefaultHealthChecks();
//     }

//     public async Task<GetHealthStatusResponse> GetDetailedHealthStatusAsync(
//         string serviceName,
//         bool includeDependencies = true,
//         bool includeMetrics = false,
//         CancellationToken cancellationToken = default)
//     {
//         var stopwatch = Stopwatch.StartNew();
//         var dependencies = new Dictionary<string, DependencyHealth>();
//         var metrics = includeMetrics ? new Dictionary<string, object>() : null;
        
//         try
//         {
//             // Check main service health
//             var isServiceHealthy = await _serviceCommunication.CheckServiceHealthAsync(serviceName, cancellationToken);
//             var serviceStatus = isServiceHealthy ? HealthStatus.Healthy : HealthStatus.Unhealthy;
            
//             if (includeDependencies)
//             {
//                 dependencies = await GetDependenciesHealthAsync(serviceName, cancellationToken);
//             }
            
//             if (includeMetrics)
//             {
//                 metrics = await CollectServiceMetricsAsync(serviceName, cancellationToken);
//             }
            
//             // Determine overall status based on dependencies
//             var overallStatus = DetermineOverallStatus(serviceStatus, dependencies.Values);
            
//             return new GetHealthStatusResponse(
//                 serviceName,
//                 overallStatus,
//                 DateTime.UtcNow,
//                 dependencies,
//                 metrics
//             );
//         }
//         catch (Exception ex)
//         {
//             _logger.LogError(ex, "Error getting health status for {ServiceName}", serviceName);
            
//             return new GetHealthStatusResponse(
//                 serviceName,
//                 HealthStatus.Unhealthy,
//                 DateTime.UtcNow,
//                 dependencies,
//                 metrics,
//                 ex.Message
//             );
//         }
//         finally
//         {
//             stopwatch.Stop();
//             _logger.LogDebug("Health check for {ServiceName} completed in {Duration}ms", 
//                 serviceName, stopwatch.ElapsedMilliseconds);
//         }
//     }

//     public async Task<Dictionary<string, GetHealthStatusResponse>> GetAllServicesHealthAsync(
//         CancellationToken cancellationToken = default)
//     {
//         var results = new Dictionary<string, GetHealthStatusResponse>();
        
//         var tasks = _knownServices.Select(async service =>
//         {
//             try
//             {
//                 var health = await GetDetailedHealthStatusAsync(service, true, false, cancellationToken);
//                 return new { Service = service, Health = health };
//             }
//             catch (Exception ex)
//             {
//                 _logger.LogWarning(ex, "Failed to get health status for {ServiceName}", service);
//                 return new 
//                 { 
//                     Service = service, 
//                     Health = new GetHealthStatusResponse(
//                         service, 
//                         HealthStatus.Unhealthy, 
//                         DateTime.UtcNow, 
//                         new Dictionary<string, DependencyHealth>(),
//                         null,
//                         ex.Message
//                     )
//                 };
//             }
//         });
        
//         var healthResults = await Task.WhenAll(tasks);
        
//         foreach (var result in healthResults)
//         {
//             results[result.Service] = result.Health;
//         }
        
//         return results;
//     }

//     public async Task<bool> IsServiceHealthyAsync(string serviceName, CancellationToken cancellationToken = default)
//     {
//         try
//         {
//             return await _serviceCommunication.CheckServiceHealthAsync(serviceName, cancellationToken);
//         }
//         catch (Exception ex)
//         {
//             _logger.LogWarning(ex, "Health check failed for {ServiceName}", serviceName);
//             return false;
//         }
//     }

//     public Task RegisterHealthCheckAsync(string checkName, Func<CancellationToken, Task<HealthCheckResult>> check)
//     {
//         _customChecks[checkName] = check;
//         _logger.LogDebug("Registered custom health check: {CheckName}", checkName);
//         return Task.CompletedTask;
//     }

//     public async Task<HealthCheckResult> ExecuteHealthCheckAsync(string checkName, CancellationToken cancellationToken = default)
//     {
//         if (!_customChecks.TryGetValue(checkName, out var check))
//         {
//             return new HealthCheckResult(
//                 checkName,
//                 HealthStatus.Unhealthy,
//                 TimeSpan.Zero,
//                 $"Health check '{checkName}' not found"
//             );
//         }
        
//         var stopwatch = Stopwatch.StartNew();
        
//         try
//         {
//             var result = await check(cancellationToken);
//             stopwatch.Stop();
            
//             return result with { ResponseTime = stopwatch.Elapsed };
//         }
//         catch (Exception ex)
//         {
//             stopwatch.Stop();
//             _logger.LogError(ex, "Health check {CheckName} failed", checkName);
            
//             return new HealthCheckResult(
//                 checkName,
//                 HealthStatus.Unhealthy,
//                 stopwatch.Elapsed,
//                 ex.Message
//             );
//         }
//     }

//     private async Task<Dictionary<string, DependencyHealth>> GetDependenciesHealthAsync(
//         string serviceName,
//         CancellationToken cancellationToken)
//     {
//         var dependencies = new Dictionary<string, DependencyHealth>();
        
//         // Check database dependency
//         var dbHealth = await CheckDatabaseHealthAsync(cancellationToken);
//         dependencies["Database"] = dbHealth;
        
//         // Check Redis dependency
//         var redisHealth = await CheckRedisHealthAsync(cancellationToken);
//         dependencies["Redis"] = redisHealth;
        
//         // Check RabbitMQ dependency
//         var rabbitHealth = await CheckRabbitMQHealthAsync(cancellationToken);
//         dependencies["RabbitMQ"] = rabbitHealth;
        
//         // Check other services (excluding self)
//         foreach (var service in _knownServices.Where(s => s != serviceName))
//         {
//             var serviceHealth = await CheckServiceDependencyHealthAsync(service, cancellationToken);
//             dependencies[service] = serviceHealth;
//         }
        
//         return dependencies;
//     }

//     private async Task<Dictionary<string, object>> CollectServiceMetricsAsync(
//         string serviceName,
//         CancellationToken cancellationToken)
//     {
//         var metrics = new Dictionary<string, object>
//         {
//             ["Timestamp"] = DateTime.UtcNow,
//             ["ServiceName"] = serviceName,
//             ["CheckDuration"] = "N/A"
//         };
        
//         // Add memory usage if available
//         var process = Process.GetCurrentProcess();
//         metrics["MemoryUsageMB"] = process.WorkingSet64 / 1024 / 1024;
//         metrics["ThreadCount"] = process.Threads.Count;
        
//         return await Task.FromResult(metrics);
//     }

//     private static HealthStatus DetermineOverallStatus(
//         HealthStatus serviceStatus,
//         IEnumerable<DependencyHealth> dependencies)
//     {
//         if (serviceStatus == HealthStatus.Unhealthy)
//             return HealthStatus.Unhealthy;
        
//         var dependencyStatuses = dependencies.Select(d => d.Status).ToList();
        
//         if (dependencyStatuses.Any(s => s == HealthStatus.Unhealthy))
//             return HealthStatus.Degraded;
        
//         if (dependencyStatuses.Any(s => s == HealthStatus.Degraded))
//             return HealthStatus.Degraded;
        
//         return HealthStatus.Healthy;
//     }

//     private async Task<DependencyHealth> CheckDatabaseHealthAsync(CancellationToken cancellationToken)
//     {
//         var stopwatch = Stopwatch.StartNew();
        
//         try
//         {
//             // This would need to be injected based on actual DbContext
//             // For now, return a mock healthy status
//             await Task.Delay(10, cancellationToken); // Simulate DB check
//             stopwatch.Stop();
            
//             return new DependencyHealth(
//                 "Database",
//                 HealthStatus.Healthy,
//                 stopwatch.Elapsed
//             );
//         }
//         catch (Exception ex)
//         {
//             stopwatch.Stop();
//             return new DependencyHealth(
//                 "Database",
//                 HealthStatus.Unhealthy,
//                 stopwatch.Elapsed,
//                 ex.Message
//             );
//         }
//     }

//     private async Task<DependencyHealth> CheckRedisHealthAsync(CancellationToken cancellationToken)
//     {
//         var stopwatch = Stopwatch.StartNew();
        
//         try
//         {
//             var connectionString = _configuration.GetConnectionString("Redis") ?? "localhost:6379";
//             using var connection = ConnectionMultiplexer.Connect(connectionString);
//             var db = connection.GetDatabase();
//             await db.PingAsync();
//             stopwatch.Stop();
            
//             return new DependencyHealth(
//                 "Redis",
//                 HealthStatus.Healthy,
//                 stopwatch.Elapsed
//             );
//         }
//         catch (Exception ex)
//         {
//             stopwatch.Stop();
//             return new DependencyHealth(
//                 "Redis",
//                 HealthStatus.Unhealthy,
//                 stopwatch.Elapsed,
//                 ex.Message
//             );
//         }
//     }

//     private async Task<DependencyHealth> CheckRabbitMQHealthAsync(CancellationToken cancellationToken)
//     {
//         var stopwatch = Stopwatch.StartNew();
        
//         try
//         {
//             // Mock RabbitMQ health check - would need actual RabbitMQ client
//             await Task.Delay(5, cancellationToken);
//             stopwatch.Stop();
            
//             return new DependencyHealth(
//                 "RabbitMQ",
//                 HealthStatus.Healthy,
//                 stopwatch.Elapsed
//             );
//         }
//         catch (Exception ex)
//         {
//             stopwatch.Stop();
//             return new DependencyHealth(
//                 "RabbitMQ",
//                 HealthStatus.Unhealthy,
//                 stopwatch.Elapsed,
//                 ex.Message
//             );
//         }
//     }

//     private async Task<DependencyHealth> CheckServiceDependencyHealthAsync(
//         string serviceName,
//         CancellationToken cancellationToken)
//     {
//         var stopwatch = Stopwatch.StartNew();
        
//         try
//         {
//             var isHealthy = await _serviceCommunication.CheckServiceHealthAsync(serviceName, cancellationToken);
//             stopwatch.Stop();
            
//             return new DependencyHealth(
//                 serviceName,
//                 isHealthy ? HealthStatus.Healthy : HealthStatus.Unhealthy,
//                 stopwatch.Elapsed
//             );
//         }
//         catch (Exception ex)
//         {
//             stopwatch.Stop();
//             return new DependencyHealth(
//                 serviceName,
//                 HealthStatus.Unhealthy,
//                 stopwatch.Elapsed,
//                 ex.Message
//             );
//         }
//     }

//     private void RegisterDefaultHealthChecks()
//     {
//         RegisterHealthCheckAsync("system-memory", async cancellationToken =>
//         {
//             var process = Process.GetCurrentProcess();
//             var memoryUsageMB = process.WorkingSet64 / 1024 / 1024;
//             var status = memoryUsageMB > 1000 ? HealthStatus.Degraded : HealthStatus.Healthy;
            
//             return new HealthCheckResult(
//                 "system-memory",
//                 status,
//                 TimeSpan.FromMilliseconds(1),
//                 null,
//                 new Dictionary<string, object> { ["MemoryUsageMB"] = memoryUsageMB }
//             );
//         });
        
//         RegisterHealthCheckAsync("disk-space", async cancellationToken =>
//         {
//             try
//             {
//                 var drives = DriveInfo.GetDrives().Where(d => d.IsReady).ToArray();
//                 var systemDrive = drives.FirstOrDefault(d => d.Name.StartsWith("C:")) ?? drives.FirstOrDefault();
                
//                 if (systemDrive != null)
//                 {
//                     var freeSpaceGB = systemDrive.AvailableFreeSpace / 1024 / 1024 / 1024;
//                     var status = freeSpaceGB < 5 ? HealthStatus.Unhealthy : 
//                                 freeSpaceGB < 10 ? HealthStatus.Degraded : HealthStatus.Healthy;
                    
//                     return new HealthCheckResult(
//                         "disk-space",
//                         status,
//                         TimeSpan.FromMilliseconds(5),
//                         null,
//                         new Dictionary<string, object> 
//                         { 
//                             ["FreeSpaceGB"] = freeSpaceGB,
//                             ["Drive"] = systemDrive.Name
//                         }
//                     );
//                 }
                
//                 return new HealthCheckResult(
//                     "disk-space",
//                     HealthStatus.Unhealthy,
//                     TimeSpan.FromMilliseconds(1),
//                     "No system drive found"
//                 );
//             }
//             catch (Exception ex)
//             {
//                 return new HealthCheckResult(
//                     "disk-space",
//                     HealthStatus.Unhealthy,
//                     TimeSpan.FromMilliseconds(1),
//                     ex.Message
//                 );
//             }
//         });
//     }
// }
