using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Infrastructure.Security;

namespace UserService.Infrastructure.BackgroundServices;

/// <summary>
/// Background service that periodically cleans up expired tokens from Redis
/// </summary>
public class TokenCleanupBackgroundService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<TokenCleanupBackgroundService> _logger;
    private readonly TimeSpan _cleanupInterval = TimeSpan.FromHours(1); // Run every hour

    public TokenCleanupBackgroundService(
        IServiceProvider serviceProvider,
        ILogger<TokenCleanupBackgroundService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation(
            "Token Cleanup Background Service started. Will run every {Interval} hours",
            _cleanupInterval.TotalHours);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await Task.Delay(_cleanupInterval, stoppingToken);

                await CleanupExpiredTokensAsync(stoppingToken);
            }
            catch (OperationCanceledException)
            {
                _logger.LogInformation("Token Cleanup Background Service is stopping");
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in Token Cleanup Background Service");
            }
        }

        _logger.LogInformation("Token Cleanup Background Service stopped");
    }

    private async Task CleanupExpiredTokensAsync(CancellationToken cancellationToken)
    {
        try
        {
            using var scope = _serviceProvider.CreateScope();
            var tokenRevocationService = scope.ServiceProvider.GetRequiredService<ITokenRevocationService>();

            _logger.LogDebug("Starting token cleanup");

            await tokenRevocationService.CleanupExpiredTokensAsync();

            _logger.LogInformation("Token cleanup completed. Cleaned up expired tokens from Redis");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during token cleanup");
        }
    }
}
