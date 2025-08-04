using Microsoft.Extensions.Logging;
using CQRS.Interfaces;
using CQRS.Models;

namespace CQRS.Handlers;

/// <summary>
/// Base class for all query handlers
/// </summary>
/// <typeparam name="TQuery">Query type</typeparam>
/// <typeparam name="TResponse">Response type</typeparam>
public abstract class BaseQueryHandler<TQuery, TResponse>(
    ILogger logger) 
    : IQueryHandler<TQuery, TResponse>
    where TQuery : IQuery<TResponse>
{
    protected readonly ILogger Logger = logger;

    public abstract Task<ApiResponse<TResponse>> Handle(TQuery request, CancellationToken cancellationToken);

    protected ApiResponse<TResponse> Success(TResponse data, string? message = null)
    {
        return ApiResponse<TResponse>.SuccessResult(data, message);
    }

    protected ApiResponse<TResponse> Error(string error)
    {
        Logger.LogError("Query {QueryType} failed: {Error}", typeof(TQuery).Name, error);
        return ApiResponse<TResponse>.ErrorResult(error);
    }

    protected ApiResponse<TResponse> NotFound(string? message = null)
    {
        var errorMessage = message ?? $"{typeof(TResponse).Name} not found";
        Logger.LogWarning("Query {QueryType}: {Message}", typeof(TQuery).Name, errorMessage);
        return ApiResponse<TResponse>.ErrorResult(errorMessage);
    }

    protected ApiResponse<TResponse> BadRequest(string message)
    {
        Logger.LogWarning("Query {QueryType} bad request: {Message}", typeof(TQuery).Name, message);
        return ApiResponse<TResponse>.ErrorResult(message);
    }
}
