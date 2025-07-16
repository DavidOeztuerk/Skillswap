using MediatR;
using Infrastructure.Models;

namespace CQRS.Interfaces;

/// <summary>
/// Marker interface for all commands
/// </summary>
public interface ICommand : IRequest<ApiResponse<object>>
{
}

/// <summary>
/// Command with typed response
/// </summary>
/// <typeparam name="TResponse">Response type</typeparam>
public interface ICommand<TResponse> : IRequest<ApiResponse<TResponse>>
{
}
