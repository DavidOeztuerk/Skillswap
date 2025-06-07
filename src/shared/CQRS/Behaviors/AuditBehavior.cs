using MediatR;
using Microsoft.Extensions.Logging;
using CQRS.Interfaces;

namespace CQRS.Behaviors;

/// <summary>
/// Audit behavior for commands
/// </summary>
/// <typeparam name="TRequest"></typeparam>
/// <typeparam name="TResponse"></typeparam>
public class AuditBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    where TRequest : notnull
{
    private readonly ILogger<AuditBehavior<TRequest, TResponse>> _logger;

    public AuditBehavior(ILogger<AuditBehavior<TRequest, TResponse>> logger)
    {
        _logger = logger;
    }

    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken)
    {
        // Only audit commands
        if (request is not ICommand)
        {
            return await next();
        }

        var requestName = typeof(TRequest).Name;
        var userId = "System";

        if (request is IAuditableCommand auditableCommand)
        {
            userId = auditableCommand.UserId ?? "Anonymous";
        }

        _logger.LogInformation("Audit: User {UserId} executing command {CommandName} at {Timestamp}",
            userId, requestName, DateTime.UtcNow);

        var response = await next();

        _logger.LogInformation("Audit: Command {CommandName} completed successfully for user {UserId}",
            requestName, userId);

        return response;
    }
}