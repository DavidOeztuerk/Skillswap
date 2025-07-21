using FluentValidation;
using Contracts.Common;

namespace Contracts.Validation.Common;

/// <summary>
/// Validator for paged requests
/// </summary>
public class PagedRequestValidator : AbstractValidator<PagedRequest>
{
    public PagedRequestValidator()
    {
        RuleFor(x => x.PageNumber)
            .GreaterThan(0)
            .WithMessage("Page number must be greater than 0");

        RuleFor(x => x.PageSize)
            .InclusiveBetween(1, 100)
            .WithMessage("Page size must be between 1 and 100");
    }
}

/// <summary>
/// Validator for sorted paged requests
/// </summary>
public class SortedPagedRequestValidator : AbstractValidator<SortedPagedRequest>
{
    private static readonly string[] AllowedSortFields = 
    {
        "id", "name", "createdAt", "updatedAt", "email", "username", 
        "title", "description", "status", "priority", "category"
    };

    public SortedPagedRequestValidator()
    {
        Include(new PagedRequestValidator());

        RuleFor(x => x.SortBy)
            .Must(BeValidSortField)
            .WithMessage($"Sort field must be one of: {string.Join(", ", AllowedSortFields)}")
            .When(x => !string.IsNullOrEmpty(x.SortBy));

        RuleFor(x => x.SortDirection)
            .IsInEnum()
            .WithMessage("Invalid sort direction");
    }

    private static bool BeValidSortField(string? sortBy)
    {
        if (string.IsNullOrEmpty(sortBy)) return true;
        return AllowedSortFields.Contains(sortBy.ToLowerInvariant());
    }
}

/// <summary>
/// Validator for filtered paged requests
/// </summary>
public class FilteredPagedRequestValidator : AbstractValidator<FilteredPagedRequest>
{
    public FilteredPagedRequestValidator()
    {
        Include(new SortedPagedRequestValidator());

        RuleFor(x => x.SearchTerm)
            .MaximumLength(200)
            .WithMessage("Search term must not exceed 200 characters")
            .When(x => !string.IsNullOrEmpty(x.SearchTerm));

        RuleFor(x => x.Filters)
            .Must(HaveValidFilters)
            .WithMessage("Invalid filter format")
            .When(x => x.Filters != null);
    }

    private static bool HaveValidFilters(Dictionary<string, object>? filters)
    {
        if (filters == null) return true;
        
        return filters.All(kvp => 
            !string.IsNullOrWhiteSpace(kvp.Key) && 
            kvp.Key.Length <= 50);
    }
}

/// <summary>
/// Validator for filter criteria
/// </summary>
public class FilterCriteriaValidator : AbstractValidator<FilterCriteria>
{
    private static readonly string[] AllowedFields = 
    {
        "id", "name", "email", "username", "status", "category", 
        "createdAt", "updatedAt", "isActive", "priority"
    };

    public FilterCriteriaValidator()
    {
        RuleFor(x => x.Field)
            .NotEmpty()
            .WithMessage("Field name is required")
            .MaximumLength(50)
            .WithMessage("Field name must not exceed 50 characters")
            .Must(BeValidField)
            .WithMessage($"Field must be one of: {string.Join(", ", AllowedFields)}");

        RuleFor(x => x.Operator)
            .IsInEnum()
            .WithMessage("Invalid filter operator");

        RuleFor(x => x.Value)
            .NotNull()
            .WithMessage("Value is required")
            .When(x => x.Operator != FilterOperator.IsNull && x.Operator != FilterOperator.IsNotNull);

        RuleFor(x => x.Values)
            .NotNull()
            .WithMessage("Values array is required for In/NotIn operations")
            .Must(values => values!.Length >= 1)
            .WithMessage("Values array must contain at least one element")
            .When(x => x.Operator == FilterOperator.In || x.Operator == FilterOperator.NotIn);

        RuleFor(x => x.Values)
            .NotNull()
            .WithMessage("Values array is required for Between operation")
            .Must(values => values!.Length == 2)
            .WithMessage("Values array must contain exactly two elements for Between operation")
            .When(x => x.Operator == FilterOperator.Between);
    }

    private static bool BeValidField(string field)
    {
        return AllowedFields.Contains(field.ToLowerInvariant());
    }
}

/// <summary>
/// Validator for advanced filter requests
/// </summary>
public class AdvancedFilterRequestValidator : AbstractValidator<AdvancedFilterRequest>
{
    public AdvancedFilterRequestValidator()
    {
        Include(new FilteredPagedRequestValidator());

        RuleFor(x => x.Filters)
            .Must(filters => filters!.Count <= 10)
            .WithMessage("Maximum of 10 filters allowed")
            .When(x => x.Filters != null);

        RuleForEach(x => x.Filters)
            .SetValidator(new FilterCriteriaValidator())
            .When(x => x.Filters != null);

        RuleFor(x => x.LogicalOperator)
            .IsInEnum()
            .WithMessage("Invalid logical operator");
    }
}