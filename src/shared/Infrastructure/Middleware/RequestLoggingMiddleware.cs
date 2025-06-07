using System.Diagnostics;
using System.Text;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Middleware;

public class RequestLoggingMiddleware(
    RequestDelegate next,
    ILogger<RequestLoggingMiddleware> logger)
{
    private readonly RequestDelegate _next = next;
    private readonly ILogger<RequestLoggingMiddleware> _logger = logger;

    public async Task InvokeAsync(HttpContext context)
    {
        var stopwatch = Stopwatch.StartNew();
        var originalBodyStream = context.Response.Body;

        try
        {
            await LogRequestAsync(context);

            using var responseBody = new MemoryStream();
            context.Response.Body = responseBody;

            await _next(context);

            stopwatch.Stop();
            await LogResponseAsync(context, responseBody, stopwatch.ElapsedMilliseconds);

            responseBody.Seek(0, SeekOrigin.Begin);
            await responseBody.CopyToAsync(originalBodyStream);
        }
        finally
        {
            context.Response.Body = originalBodyStream;
        }
    }

    private async Task LogRequestAsync(HttpContext context)
    {
        var request = context.Request;

        var requestLog = new
        {
            Method = request.Method,
            Path = request.Path.Value,
            QueryString = request.QueryString.Value,
            Headers = request.Headers
                .Where(h => !IsSensitiveHeader(h.Key))
                .ToDictionary(h => h.Key, h => h.Value.ToString()),
            UserAgent = request.Headers.UserAgent.ToString(),
            RemoteIpAddress = context.Connection.RemoteIpAddress?.ToString(),
            Body = await GetRequestBodyAsync(request)
        };

        _logger.LogInformation("Incoming Request: {@RequestLog}", requestLog);
    }

    private async Task LogResponseAsync(HttpContext context, MemoryStream responseBody, long elapsedMs)
    {
        var response = context.Response;

        var responseLog = new
        {
            StatusCode = response.StatusCode,
            ElapsedMilliseconds = elapsedMs,
            Headers = response.Headers
                .Where(h => !IsSensitiveHeader(h.Key))
                .ToDictionary(h => h.Key, h => h.Value.ToString()),
            ContentLength = response.ContentLength,
            Body = await GetResponseBodyAsync(responseBody)
        };

        if (response.StatusCode >= 400)
        {
            _logger.LogWarning("Outgoing Response (Error): {@ResponseLog}", responseLog);
        }
        else
        {
            _logger.LogInformation("Outgoing Response: {@ResponseLog}", responseLog);
        }
    }

    private static async Task<string?> GetRequestBodyAsync(HttpRequest request)
    {
        if (!request.HasFormContentType && request.ContentLength > 0)
        {
            request.EnableBuffering();

            var buffer = new byte[Convert.ToInt32(request.ContentLength)];
            await request.Body.ReadExactlyAsync(buffer, 0, buffer.Length);

            var bodyText = Encoding.UTF8.GetString(buffer);
            request.Body.Position = 0;

            return SanitizeRequestBody(bodyText);
        }

        return null;
    }

    private static async Task<string?> GetResponseBodyAsync(MemoryStream responseBody)
    {
        if (responseBody.Length > 0)
        {
            responseBody.Seek(0, SeekOrigin.Begin);
            var text = await new StreamReader(responseBody).ReadToEndAsync();
            responseBody.Seek(0, SeekOrigin.Begin);

            return text.Length > 1000 ? text[..1000] + "..." : text;
        }

        return null;
    }

    private static string SanitizeRequestBody(string body)
    {
        // Remove sensitive information from request body
        if (body.Contains("password", StringComparison.OrdinalIgnoreCase))
        {
            return "[REDACTED - Contains sensitive information]";
        }

        return body.Length > 1000 ? body[..1000] + "..." : body;
    }

    private static bool IsSensitiveHeader(string headerName)
    {
        var sensitiveHeaders = new[]
        {
            "authorization",
            "cookie",
            "x-api-key",
            "x-auth-token"
        };

        return sensitiveHeaders.Contains(headerName.ToLowerInvariant());
    }
}
