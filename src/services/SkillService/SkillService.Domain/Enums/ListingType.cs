namespace SkillService.Domain.Entities;

/// <summary>
/// Type constants for skill listings
/// Replaces the previous Skill.IsOffered boolean
/// </summary>
public static class ListingType
{
    /// <summary>
    /// User is offering to teach this skill
    /// </summary>
    public const string Offer = "Offer";

    /// <summary>
    /// User is requesting to learn this skill
    /// </summary>
    public const string Request = "Request";

    /// <summary>
    /// All valid listing types for validation
    /// </summary>
    public static readonly string[] All = [Offer, Request];

    /// <summary>
    /// Converts from the old IsOffered boolean
    /// </summary>
    public static string FromIsOffered(bool isOffered) =>
        isOffered ? Offer : Request;

    /// <summary>
    /// Converts to the old IsOffered boolean for backward compatibility
    /// </summary>
    public static bool ToIsOffered(string type) =>
        type == Offer;
}
