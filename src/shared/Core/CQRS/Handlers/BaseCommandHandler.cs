using Microsoft.Extensions.Logging;
using CQRS.Interfaces;
using Infrastructure.Models;

namespace CQRS.Handlers;

/// <summary>
/// Base class for command handlers with typed response
/// </summary>
/// <typeparam name="TCommand">Command type</typeparam>
/// <typeparam name="TResponse">Response type</typeparam>
public abstract class BaseCommandHandler<TCommand, TResponse>(
    ILogger logger) 
    : ICommandHandler<TCommand, TResponse>
    where TCommand : ICommand<TResponse>
{
    protected readonly ILogger Logger = logger;

    public abstract Task<ApiResponse<TResponse>> Handle(TCommand request, CancellationToken cancellationToken);

    protected ApiResponse<TResponse> Success(TResponse data, string? message = null)
    {
        return ApiResponse<TResponse>.SuccessResult(data, message);
    }

    protected ApiResponse<TResponse> Error(string error)
    {
        Logger.LogError("Command {CommandType} failed: {Error}", typeof(TCommand).Name, error);
        return ApiResponse<TResponse>.ErrorResult(error);
    }

    protected ApiResponse<TResponse> Error(List<string> errors)
    {
        Logger.LogError("Command {CommandType} failed with multiple errors: {Errors}",
            typeof(TCommand).Name, string.Join(", ", errors));
        return ApiResponse<TResponse>.ErrorResult(errors);
    }
}
