using MediatR;
using Infrastructure.Models;

namespace CQRS.Interfaces;

/// <summary>
/// Interface for paginated queries
/// </summary>
/// <typeparam name="TResponse">Response item type</typeparam>
public interface IPagedQuery<TResponse> : IRequest<PagedResponse<TResponse>>
{
    int PageNumber { get; set; }
    int PageSize { get; set; }
}
