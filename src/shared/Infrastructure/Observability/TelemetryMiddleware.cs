// using Microsoft.AspNetCore.Builder;
// using Microsoft.AspNetCore.Http;
// using Microsoft.Extensions.Logging;
// using System.Diagnostics;

// namespace Infrastructure.Observability;

// /// <summary>
// /// Middleware for enhanced telemetry and observability
// /// </summary>
// public class TelemetryMiddleware
// {
//     private readonly RequestDelegate _next;
//     private readonly ILogger<TelemetryMiddleware> _logger;
//     private readonly ITelemetryService _telemetryService;
//     private readonly ICustomMetrics _metrics;

//     public TelemetryMiddleware(
//         RequestDelegate next,
//         ILogger<TelemetryMiddleware> logger,
//         ITelemetryService telemetryService,
//         ICustomMetrics metrics)
//     {
//         _next = next;
//         _logger = logger;
//         _telemetryService = telemetryService;
//         _metrics = metrics;
//     }

//     public async Task InvokeAsync(HttpContext context)
//     {
//         var stopwatch = Stopwatch.StartNew();
//         var requestPath = context.Request.Path.Value ?? "";
//         var method = context.Request.Method;

//         // Start a new activity for this request
//         using var activity = _telemetryService.StartActivity($"{method} {requestPath}", ActivityKind.Server);

//         // Add standard request tags
//         _telemetryService.AddTags(
//             new KeyValuePair<string, object?>("http.method", method),
//             new KeyValuePair<string, object?>("http.url", GetFullUrl(context.Request)),
//             new KeyValuePair<string, object?>("http.scheme", context.Request.Scheme),
//             new KeyValuePair<string, object?>("http.host", context.Request.Host.Value),
//             new KeyValuePair<string, object?>("http.path", requestPath),
//             new KeyValuePair<string, object?>("http.query", context.Request.QueryString.Value),
//             new KeyValuePair<string, object?>("user.id", GetUserId(context)),
//             new KeyValuePair<string, object?>("user_agent", context.Request.Headers.UserAgent.FirstOrDefault()),
//             new KeyValuePair<string, object?>("client.ip", GetClientIpAddress(context))
//         );

//         var statusCode = 0;
//         Exception? exception = null;

//         try
//         {
//             // Execute the request
//             await _next(context);
//             statusCode = context.Response.StatusCode;

//             // Add response tags
//             _telemetryService.AddTags(
//                 new KeyValuePair<string, object?>("http.status_code", statusCode),
//                 new KeyValuePair<string, object?>("http.response.content_length", context.Response.ContentLength)
//             );

//             // Set activity status based on response
//             if (statusCode >= 400)
//             {
//                 _telemetryService.SetStatus(ActivityStatusCode.Error, $"HTTP {statusCode}");
//             }
//             else
//             {
//                 _telemetryService.SetStatus(ActivityStatusCode.Ok);
//             }
//         }
//         catch (Exception ex)
//         {
//             exception = ex;
//             statusCode = 500;

//             // Record the exception
//             _telemetryService.RecordException(ex);
//             _telemetryService.SetStatus(ActivityStatusCode.Error, ex.Message);

//             throw;
//         }
//         finally
//         {
//             stopwatch.Stop();
//             var duration = stopwatch.Elapsed.TotalMilliseconds;

//             // Record metrics
//             // _metrics.RecordRequestDuration(duration, requestPath, method);

//             // Add duration to activity
//             _telemetryService.AddTags(
//                 new KeyValuePair<string, object?>("http.request.duration_ms", duration)
//             );

//             // Log request completion
//             LogRequestCompletion(context, duration, statusCode, exception);
//         }
//     }

//     private static string GetFullUrl(HttpRequest request)
//     {
//         return $"{request.Scheme}://{request.Host}{request.Path}{request.QueryString}";
//     }

//     private static string? GetUserId(HttpContext context)
//     {
//         return context.User?.FindFirst("user_id")?.Value
//                ?? context.User?.FindFirst("sub")?.Value
//                ?? context.User?.FindFirst("id")?.Value;
//     }

//     private static string? GetClientIpAddress(HttpContext context)
//     {
//         return context.Request.Headers["X-Forwarded-For"].FirstOrDefault()
//                ?? context.Request.Headers["X-Real-IP"].FirstOrDefault()
//                ?? context.Connection.RemoteIpAddress?.ToString();
//     }

//     private void LogRequestCompletion(HttpContext context, double duration, int statusCode, Exception? exception)
//     {
//         var level = statusCode switch
//         {
//             >= 500 => LogLevel.Error,
//             >= 400 => LogLevel.Warning,
//             _ => LogLevel.Information
//         };

//         var userId = GetUserId(context);
//         var clientIp = GetClientIpAddress(context);

//         using var scope = _logger.BeginScope(new Dictionary<string, object?>
//         {
//             ["RequestId"] = context.TraceIdentifier,
//             ["UserId"] = userId,
//             ["ClientIP"] = clientIp,
//             ["Duration"] = duration,
//             ["StatusCode"] = statusCode
//         });

//         if (exception != null)
//         {
//             _logger.Log(level, exception,
//                 "HTTP {Method} {Path} responded {StatusCode} in {Duration:F2}ms",
//                 context.Request.Method,
//                 context.Request.Path,
//                 statusCode,
//                 duration);
//         }
//         else
//         {
//             _logger.Log(level,
//                 "HTTP {Method} {Path} responded {StatusCode} in {Duration:F2}ms",
//                 context.Request.Method,
//                 context.Request.Path,
//                 statusCode,
//                 duration);
//         }
//     }
// }

// /// <summary>
// /// Middleware for adding correlation IDs to requests
// /// </summary>
// public class CorrelationIdMiddleware
// {
//     private readonly RequestDelegate _next;
//     private readonly ILogger<CorrelationIdMiddleware> _logger;
//     private const string CorrelationIdHeaderName = "X-Correlation-ID";
//     private const string CorrelationIdLogProperty = "CorrelationId";

//     public CorrelationIdMiddleware(RequestDelegate next, ILogger<CorrelationIdMiddleware> logger)
//     {
//         _next = next;
//         _logger = logger;
//     }

//     public async Task InvokeAsync(HttpContext context)
//     {
//         // Get correlation ID from header or generate a new one
//         var correlationId = GetOrGenerateCorrelationId(context);

//         // Add correlation ID to response headers
//         context.Response.Headers.TryAdd(CorrelationIdHeaderName, correlationId);

//         // Add correlation ID to current activity
//         Activity.Current?.SetTag("correlation.id", correlationId);

//         // Add correlation ID to log scope
//         using var scope = _logger.BeginScope(new Dictionary<string, object>
//         {
//             [CorrelationIdLogProperty] = correlationId
//         });

//         // Store correlation ID in HttpContext for other middleware/controllers
//         context.Items[CorrelationIdLogProperty] = correlationId;

//         await _next(context);
//     }

//     private static string GetOrGenerateCorrelationId(HttpContext context)
//     {
//         // Check if correlation ID is already present in request headers
//         if (context.Request.Headers.TryGetValue(CorrelationIdHeaderName, out var correlationId)
//             && !string.IsNullOrEmpty(correlationId))
//         {
//             return correlationId.ToString();
//         }

//         // Check trace identifier
//         if (!string.IsNullOrEmpty(context.TraceIdentifier))
//         {
//             return context.TraceIdentifier;
//         }

//         // Generate a new correlation ID
//         return Guid.NewGuid().ToString();
//     }
// }

// /// <summary>
// /// Extension methods for telemetry middleware
// /// </summary>
// public static class TelemetryMiddlewareExtensions
// {
//     /// <summary>
//     /// Add telemetry middleware to the pipeline
//     /// </summary>
//     public static IApplicationBuilder UseTelemetry(this IApplicationBuilder app)
//     {
//         return app.UseMiddleware<TelemetryMiddleware>();
//     }

//     /// <summary>
//     /// Add correlation ID middleware to the pipeline
//     /// </summary>
//     public static IApplicationBuilder UseCorrelationId(this IApplicationBuilder app)
//     {
//         return app.UseMiddleware<CorrelationIdMiddleware>();
//     }
// }