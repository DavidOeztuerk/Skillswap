using System.ComponentModel.DataAnnotations;
using AutoMapper;

namespace Contracts.Mappers;




// src/shared/Contracts/Mapping/MappingExtensions.cs
namespace Contracts.Mapping;

/// <summary>
/// Extension methods for mapping
/// </summary>
public static class MappingExtensions
{
    /// <summary>
    /// Maps and validates the request
    /// </summary>
    public static TCommand MapToCommandWithValidation<TRequest, TCommand>(
        this IContractMapper<TRequest, TCommand> mapper,
        TRequest request,
        string? userId = null)
        where TRequest : class
    {
        if (request == null)
            throw new ArgumentNullException(nameof(request));

        // Perform validation if validator is available
        var validationContext = new ValidationContext<TRequest>(request);
        var validator = new DataAnnotationsValidator<TRequest>();
        var validationResult = validator.Validate(validationContext);

        if (!validationResult.IsValid)
        {
            throw new ValidationException(validationResult.Errors);
        }

        return mapper.MapToCommand(request, userId);
    }

    /// <summary>
    /// Maps with custom configuration
    /// </summary>
    public static TDestination MapWithConfig<TSource, TDestination>(
        this IMapper mapper,
        TSource source,
        Action<IMappingOperationOptions> opts)
    {
        return mapper.Map<TDestination>(source, opts);
    }
}

// src/shared/Contracts/Mapping/DataAnnotationsValidator.cs
using System.ComponentModel.DataAnnotations;
using FluentValidation;
using FluentValidation.Results;
