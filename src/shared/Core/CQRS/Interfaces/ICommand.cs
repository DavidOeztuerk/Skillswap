using MediatR;
using Infrastructure.Models;

namespace CQRS.Interfaces;

/// <summary>
/// Command with typed response
/// </summary>
/// <typeparam name="TResponse">Response type</typeparam>
public interface ICommand<TResponse> 
    : IRequest<ApiResponse<TResponse>> { }
