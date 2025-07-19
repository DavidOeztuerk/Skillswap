namespace Contracts;

/// <summary>
/// Interface for mapping between CQRS responses and API contracts
/// </summary>
/// <typeparam name="TCommandResponse">CQRS command/query response type</typeparam>
/// <typeparam name="TResponse">API response contract type</typeparam>
public interface IResponseMapper<TCommandResponse, TResponse>
{
    /// <summary>
    /// Maps a CQRS response to an API contract response
    /// </summary>
    /// <param name="commandResponse">CQRS command/query response</param>
    /// <returns>API response contract</returns>
    TResponse MapToResponse(TCommandResponse commandResponse);
}
