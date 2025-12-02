using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using UserService.Application.Services;

namespace UserService.Infrastructure.BackgroundServices;

/// <summary>
/// Background service that periodically cleans up expired and inactive sessions
/// </summary>
public class SessionCleanupBackgroundService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<SessionCleanupBackgroundService> _logger;
    private readonly TimeSpan _cleanupInterval = TimeSpan.FromMinutes(15); // Run every 15 minutes

    public SessionCleanupBackgroundService(
        IServiceProvider serviceProvider,
        ILogger<SessionCleanupBackgroundService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation(
            "Session Cleanup Background Service started. Will run every {Interval} minutes",
            _cleanupInterval.TotalMinutes);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await Task.Delay(_cleanupInterval, stoppingToken);

                await CleanupExpiredSessionsAsync(stoppingToken);
            }
            catch (OperationCanceledException)
            {
                _logger.LogInformation("Session Cleanup Background Service is stopping");
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in Session Cleanup Background Service");
            }
        }

        _logger.LogInformation("Session Cleanup Background Service stopped");
    }

    private async Task CleanupExpiredSessionsAsync(CancellationToken cancellationToken)
    {
        try
        {
            using var scope = _serviceProvider.CreateScope();
            var sessionManager = scope.ServiceProvider.GetRequiredService<ISessionManager>();

            _logger.LogDebug("Starting session cleanup");

            var cleanedCount = await sessionManager.CleanupExpiredSessionsAsync(cancellationToken);

            if (cleanedCount > 0)
            {
                _logger.LogInformation(
                    "Session cleanup completed. Cleaned up {Count} expired sessions",
                    cleanedCount);
            }
            else
            {
                _logger.LogDebug("Session cleanup completed. No expired sessions found");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during session cleanup");
        }
    }
}
