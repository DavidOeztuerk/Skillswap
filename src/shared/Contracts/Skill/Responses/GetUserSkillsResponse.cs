namespace Contracts.Skill.Responses;

/// <summary>
/// Individual user skill response
/// </summary>
/// <param name="UserId">Owner user ID</param>
/// <param name="SkillId">Unique identifier for the skill</param>
/// <param name="Name">Name of the skill</param>
/// <param name="Description">Detailed description of the skill</param>
/// <param name="Category">Skill category information</param>
/// <param name="Tags">Associated tags for the skill</param>
/// <param name="IsOffered">Whether the user is offering this skill</param>
/// <param name="AverageRating">Average rating for the skill</param>
/// <param name="ReviewCount">Number of reviews for the skill</param>
/// <param name="EndorsementCount">Number of endorsements for the skill</param>
/// <param name="CreatedAt">When the skill was created</param>
/// <param name="UpdatedAt">When the skill was last updated</param>
/// <param name="LocationType">Location type (remote, in_person, both)</param>
/// <param name="LocationCity">City for in-person meetings</param>
/// <param name="LocationCountry">Country for in-person meetings</param>
/// <param name="MaxDistanceKm">Maximum distance for in-person meetings</param>
/// <param name="OwnerUserName">Owner's username</param>
/// <param name="OwnerFirstName">Owner's first name</param>
/// <param name="OwnerLastName">Owner's last name</param>
public record UserSkillResponse(
    string UserId,
    string SkillId,
    string Name,
    string Description,
    SkillCategoryResponse Category,
    List<string> Tags,
    bool IsOffered,
    double? AverageRating,
    int ReviewCount,
    int EndorsementCount,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    // Location fields
    string? LocationType = null,
    string? LocationCity = null,
    string? LocationCountry = null,
    int? MaxDistanceKm = null,
    // Owner info
    string? OwnerUserName = null,
    string? OwnerFirstName = null,
    string? OwnerLastName = null);

/// <summary>
/// Skill category response with optional hierarchy
/// </summary>
/// <param name="CategoryId">Unique identifier for the category</param>
/// <param name="Name">Name of the category</param>
/// <param name="IconName">Icon name for the category</param>
/// <param name="Color">Color associated with the category</param>
/// <param name="SkillCount">Number of skills in the category</param>
/// <param name="Subcategories">Optional list of subcategories (when hierarchy is requested)</param>
public record SkillCategoryResponse(
    string CategoryId,
    string Name,
    string? IconName,
    string? Color,
    int? SkillCount,
    List<SkillSubcategoryResponse>? Subcategories = null);

/// <summary>
/// Skill subcategory response
/// </summary>
/// <param name="Id">Unique identifier for the subcategory</param>
/// <param name="Name">Name of the subcategory</param>
/// <param name="IconName">Icon name for the subcategory</param>
/// <param name="Topics">List of topics in this subcategory</param>
public record SkillSubcategoryResponse(
    string Id,
    string Name,
    string? IconName,
    List<SkillTopicResponse> Topics);

/// <summary>
/// Skill topic response
/// </summary>
/// <param name="Id">Unique identifier for the topic</param>
/// <param name="Name">Name of the topic</param>
/// <param name="IsFeatured">Whether this topic is featured/popular</param>
/// <param name="SkillCount">Number of skills with this topic</param>
public record SkillTopicResponse(
    string Id,
    string Name,
    bool IsFeatured,
    int SkillCount);
