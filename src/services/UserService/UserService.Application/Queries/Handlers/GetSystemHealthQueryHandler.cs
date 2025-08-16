using System.Diagnostics;
using CQRS.Handlers;
using CQRS.Models;
using Microsoft.Extensions.Logging;
using UserService.Application.Commands;
using UserService.Domain.Repositories;

namespace UserService.Application.Queries.Handlers;

public class GetSystemHealthQueryHandler(
    IUserRepository context,
    ILogger<GetSystemHealthQueryHandler> logger)
    : BaseQueryHandler<GetSystemHealthQuery, SystemHealthResponse>(logger)
{
    private readonly IUserRepository _context = context;

    public override async Task<ApiResponse<SystemHealthResponse>> Handle(
        GetSystemHealthQuery request,
        CancellationToken cancellationToken)
    {
        await Task.CompletedTask;
        try
        {
            Logger.LogInformation("Getting system health status");

            // Check database connectivity
            var dbHealthy = CheckDatabaseHealth(cancellationToken);

            // Get system performance metrics
            var process = Process.GetCurrentProcess();
            var totalMemory = GC.GetTotalMemory(false);
            var workingSet = process.WorkingSet64;

            // Calculate CPU usage (simplified)
            var cpuUsage = process.TotalProcessorTime.TotalMilliseconds / Environment.TickCount;

            // Get disk usage (simplified - using app directory)
            var driveInfo = new DriveInfo(Path.GetPathRoot(Directory.GetCurrentDirectory())!);
            var diskUsage = 1 - ((double)driveInfo.AvailableFreeSpace / driveInfo.TotalSize);

            // Check service statuses
            var services = new List<ServiceStatus>
            {
                new ServiceStatus(
                    "UserService",
                    dbHealthy ? "online" : "degraded",
                    0.99,
                    dbHealthy ? 15 : 500
                ),
                new ServiceStatus(
                    "Database",
                    dbHealthy ? "online" : "offline",
                    dbHealthy ? 0.99 : 0,
                    dbHealthy ? 5 : 0
                ),
                new ServiceStatus(
                    "Redis",
                    "online", // Mock for now
                    0.98,
                    10
                ),
                new ServiceStatus(
                    "RabbitMQ",
                    "online", // Mock for now
                    0.99,
                    8
                )
            };

            // Generate alerts based on metrics
            var alerts = new List<SystemAlert>();

            if (cpuUsage > 0.8)
            {
                alerts.Add(new SystemAlert
                {
                    Id = Guid.NewGuid().ToString(),
                    Severity = "warning",
                    Message = "CPU usage is high",
                    Service = "UserService",
                    Timestamp = DateTime.UtcNow,
                    Resolved = false
                });
            }

            if (diskUsage > 0.85)
            {
                alerts.Add(new SystemAlert
                {
                    Id = Guid.NewGuid().ToString(),
                    Severity = "error",
                    Message = "Disk space is running low",
                    Service = "System",
                    Timestamp = DateTime.UtcNow,
                    Resolved = false
                });
            }

            // Determine overall status
            var status = alerts.Any(a => a.Severity == "error") ? "critical" :
                        alerts.Any(a => a.Severity == "warning") ? "warning" : "healthy";

            var response = new SystemHealthResponse
            {
                Status = status,
                Performance = new SystemPerformance
                {
                    CpuUsage = Math.Min(cpuUsage, 1.0),
                    MemoryUsage = (double)totalMemory / workingSet,
                    DiskUsage = diskUsage
                },
                Services = services,
                Alerts = alerts
            };

            return Success(response, "System health retrieved successfully");
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error getting system health status");

            // Return degraded status on error
            var degradedResponse = new SystemHealthResponse
            {
                Status = "critical",
                Performance = new SystemPerformance
                {
                    CpuUsage = 0,
                    MemoryUsage = 0,
                    DiskUsage = 0
                },
                Services = new List<ServiceStatus>(),
                Alerts = new List<SystemAlert>
                {
                    new SystemAlert
                    {
                        Id = Guid.NewGuid().ToString(),
                        Severity = "error",
                        Message = "Unable to retrieve system health metrics",
                        Service = "System",
                        Timestamp = DateTime.UtcNow,
                        Resolved = false
                    }
                }
            };

            return Success(degradedResponse, "System health check failed");
        }
    }

    private bool CheckDatabaseHealth(CancellationToken cancellationToken)
    {
        var users = _context.GetUsers(cancellationToken);
        return users.Any();
    }
}