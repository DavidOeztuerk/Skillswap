using MediatR;
using Infrastructure.Models;

namespace CQRS.Interfaces;

/// <summary>
/// Command handler interface
/// </summary>
/// <typeparam name="TCommand">Command type</typeparam>
public interface ICommandHandler<TCommand> : IRequestHandler<TCommand, ApiResponse<object>>
    where TCommand : ICommand
{
}

/// <summary>
/// Command handler with typed response
/// </summary>
/// <typeparam name="TCommand">Command type</typeparam>
/// <typeparam name="TResponse">Response type</typeparam>
public interface ICommandHandler<TCommand, TResponse> : IRequestHandler<TCommand, ApiResponse<TResponse>>
    where TCommand : ICommand<TResponse>
{
}
