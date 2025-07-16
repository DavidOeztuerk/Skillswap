using Microsoft.Extensions.Logging;
using CQRS.Interfaces;
using Infrastructure.Models;

namespace CQRS.Handlers;

/// <summary>
/// Base class for paged query handlers
/// </summary>
/// <typeparam name="TQuery">Query type</typeparam>
/// <typeparam name="TResponse">Response item type</typeparam>
public abstract class BasePagedQueryHandler<TQuery, TResponse> : IPagedQueryHandler<TQuery, TResponse>
    where TQuery : IPagedQuery<TResponse>
{
    protected readonly ILogger Logger;

    protected BasePagedQueryHandler(ILogger logger)
    {
        Logger = logger;
    }

    public abstract Task<PagedResponse<TResponse>> Handle(TQuery request, CancellationToken cancellationToken);

    protected PagedResponse<TResponse> Success(
        List<TResponse> data,
        int pageNumber,
        int pageSize,
        int totalRecords,
        string? message = null)
    {
        return PagedResponse<TResponse>.Create(data, pageNumber, pageSize, totalRecords, message);
    }

    protected PagedResponse<TResponse> Error(string error)
    {
        Logger.LogError("Paged Query {QueryType} failed: {Error}", typeof(TQuery).Name, error);
        return new PagedResponse<TResponse>
        {
            Success = false,
            Errors = new List<string> { error },
            Data = new List<TResponse>()
        };
    }
}
