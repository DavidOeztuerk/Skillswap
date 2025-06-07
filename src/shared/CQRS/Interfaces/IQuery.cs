using MediatR;
using Infrastructure.Models;

namespace CQRS.Interfaces;

/// <summary>
/// Marker interface for all queries
/// </summary>
public interface IQuery<TResponse> : IRequest<ApiResponse<TResponse>>
{
}
