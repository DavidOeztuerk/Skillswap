using MediatR;
using Microsoft.Extensions.Logging;
using System.Diagnostics;

namespace CQRS.Behaviors;

/// <summary>
/// Performance monitoring behavior
/// </summary>
/// <typeparam name="TRequest"></typeparam>
/// <typeparam name="TResponse"></typeparam>
public class PerformanceBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    where TRequest : notnull
{
    private readonly ILogger<PerformanceBehavior<TRequest, TResponse>> _logger;
    private const int SlowRequestThresholdMs = 1000;

    public PerformanceBehavior(ILogger<PerformanceBehavior<TRequest, TResponse>> logger)
    {
        _logger = logger;
    }

    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken)
    {
        var stopwatch = Stopwatch.StartNew();
        var response = await next();
        stopwatch.Stop();

        var elapsedMs = stopwatch.ElapsedMilliseconds;
        var requestName = typeof(TRequest).Name;

        if (elapsedMs > SlowRequestThresholdMs)
        {
            _logger.LogWarning("Slow request detected: {RequestName} took {ElapsedMs}ms with data {@Request}",
                requestName, elapsedMs, request);
        }
        else
        {
            _logger.LogDebug("Request {RequestName} completed in {ElapsedMs}ms",
                requestName, elapsedMs);
        }

        return response;
    }
}
