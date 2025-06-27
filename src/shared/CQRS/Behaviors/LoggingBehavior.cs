using MediatR;
using Microsoft.Extensions.Logging;
using System.Diagnostics;

namespace CQRS.Behaviors;

/// <summary>
/// Logging behavior for performance monitoring
/// </summary>
/// <typeparam name="TRequest"></typeparam>
/// <typeparam name="TResponse"></typeparam>
public class LoggingBehavior<TRequest, TResponse>(
    ILogger<LoggingBehavior<TRequest, TResponse>> logger) 
    : IPipelineBehavior<TRequest, TResponse>
    where TRequest : notnull
{
    private readonly ILogger<LoggingBehavior<TRequest, TResponse>> _logger = logger;

    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken)
    {
        var requestName = typeof(TRequest).Name;
        var stopwatch = Stopwatch.StartNew();

        _logger.LogInformation("Executing {RequestName} with data {@Request}", requestName, request);

        try
        {
            var response = await next(cancellationToken);

            stopwatch.Stop();

            _logger.LogInformation("Completed {RequestName} in {ElapsedMs}ms",
                requestName, stopwatch.ElapsedMilliseconds);

            return response;
        }
        catch (Exception ex)
        {
            stopwatch.Stop();

            _logger.LogError(ex, "Error executing {RequestName} after {ElapsedMs}ms",
                requestName, stopwatch.ElapsedMilliseconds);

            throw;
        }
    }
}
