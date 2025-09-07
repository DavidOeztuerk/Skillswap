namespace Core.Common.Exceptions;

/// <summary>
/// Exception thrown when attempting to create a resource that already exists
/// </summary>
public class ResourceAlreadyExistsException : DomainException
{
    public string ResourceType { get; }
    public string DuplicateField { get; }
    public string DuplicateValue { get; }

    public ResourceAlreadyExistsException(
        string resourceType,
        string duplicateField,
        string duplicateValue,
        string? message = null)
        : base(
            ErrorCodes.ResourceAlreadyExists,
            message ?? $"A {resourceType.ToLower()} with {duplicateField} '{duplicateValue}' already exists.",
            $"Please choose a different {duplicateField.ToLower()} or use the existing {resourceType.ToLower()}.",
            null,
            new Dictionary<string, object>
            {
                ["ResourceType"] = resourceType,
                ["DuplicateField"] = duplicateField,
                ["DuplicateValue"] = duplicateValue
            })
    {
        ResourceType = resourceType;
        DuplicateField = duplicateField;
        DuplicateValue = duplicateValue;
    }

    public override int GetHttpStatusCode() => 409; // Conflict
}