using AutoMapper;
using CQRS.Interfaces;

namespace Contracts.Mappers;

/// <summary>
/// Generic implementation of contract mapper
/// </summary>
public class GenericContractMapper<TRequest, TCommand>(
    IMapper mapper) : IContractMapper<TRequest, TCommand>
{
    protected readonly IMapper Mapper = mapper;

    public virtual TCommand MapToCommand(TRequest request, string? userId = null)
    {
        var command = Mapper.Map<TCommand>(request);

        // If command implements IAuditableCommand, set user ID
        if (command is IAuditableCommand auditableCommand && !string.IsNullOrEmpty(userId))
        {
            auditableCommand.UserId = userId;
            auditableCommand.Timestamp = DateTime.UtcNow;
        }

        return command;
    }
}

/// <summary>
/// Generic implementation with response mapping
/// </summary>
public class GenericContractMapper<TRequest, TResponse, TCommand, TCommandResponse>(
    IMapper mapper) : IContractMapper<TRequest, TResponse, TCommand, TCommandResponse>
{
    protected readonly IMapper Mapper = mapper;

    public virtual TCommand MapToCommand(TRequest request, string? userId = null)
    {
        var command = Mapper.Map<TCommand>(request);

        if (command is IAuditableCommand auditableCommand && !string.IsNullOrEmpty(userId))
        {
            auditableCommand.UserId = userId;
            auditableCommand.Timestamp = DateTime.UtcNow;
        }

        return command;
    }

    public virtual TResponse MapToResponse(TCommandResponse commandResponse)
    {
        return Mapper.Map<TResponse>(commandResponse);
    }
}