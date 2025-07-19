namespace Contracts;

/// <summary>
/// Interface for mapping between API contracts and CQRS commands/queries
/// </summary>
/// <typeparam name="TRequest">API request contract type</typeparam>
/// <typeparam name="TCommand">CQRS command/query type</typeparam>
public interface IContractMapper<TRequest, TCommand>
{
    /// <summary>
    /// Maps an API request to a CQRS command/query
    /// </summary>
    /// <param name="request">API request contract</param>
    /// <param name="userId">Current user ID (for auditing)</param>
    /// <returns>CQRS command/query</returns>
    TCommand MapToCommand(TRequest request, string? userId = null);
}

/// <summary>
/// Combined interface for bidirectional mapping
/// </summary>
/// <typeparam name="TRequest">API request contract type</typeparam>
/// <typeparam name="TResponse">API response contract type</typeparam>
/// <typeparam name="TCommand">CQRS command/query type</typeparam>
/// <typeparam name="TCommandResponse">CQRS command/query response type</typeparam>
public interface IContractMapper<TRequest, TResponse, TCommand, TCommandResponse>
    : IContractMapper<TRequest, TCommand>, IResponseMapper<TCommandResponse, TResponse>
{
}