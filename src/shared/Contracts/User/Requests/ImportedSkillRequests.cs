namespace Contracts.User.Requests;

/// <summary>
/// Request to add a manual imported skill
/// </summary>
public record AddImportedSkillRequest(
    string Name,
    string? Category = null,
    int SortOrder = 0);

/// <summary>
/// Request to update an imported skill
/// </summary>
public record UpdateImportedSkillRequest(
    string Name,
    string? Category = null,
    int SortOrder = 0,
    bool IsVisible = true);

/// <summary>
/// Request to update skill visibility
/// </summary>
public record UpdateImportedSkillVisibilityRequest(
    bool IsVisible);

/// <summary>
/// Request to reorder skills
/// </summary>
public record ReorderImportedSkillsRequest(
    List<SkillOrderItem> Skills);

/// <summary>
/// Item for skill ordering
/// </summary>
public record SkillOrderItem(
    string SkillId,
    int SortOrder);
