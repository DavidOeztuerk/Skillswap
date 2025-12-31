namespace SkillService.Application.Services;

/// <summary>
/// Geo-coordinate representation
/// </summary>
public record GeoCoordinate(double Latitude, double Longitude);

/// <summary>
/// Skill location data for matching
/// </summary>
public record SkillLocation(
    string LocationType,
    string? PostalCode,
    string? City,
    string? Country,
    double? Latitude,
    double? Longitude,
    int MaxDistanceKm
);

/// <summary>
/// Service for geocoding and distance calculations
/// </summary>
public interface ILocationService
{
    /// <summary>
    /// Geocode an address to coordinates using Nominatim API
    /// Should be called during skill creation, NOT during matching (rate limit: 1 req/sec)
    /// </summary>
    Task<GeoCoordinate?> GeocodeAddressAsync(
        string? postalCode,
        string? city,
        string? country,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Calculate distance between two coordinates using Haversine formula
    /// </summary>
    double CalculateDistanceKm(GeoCoordinate a, GeoCoordinate b);

    /// <summary>
    /// Check if two skill locations are compatible for matching
    /// Returns true if locations can work together (remote match, or in-person within distance)
    /// </summary>
    bool AreLocationsCompatible(SkillLocation skillA, SkillLocation skillB);

    /// <summary>
    /// Get the effective meeting location type when two skills match
    /// </summary>
    string GetEffectiveMeetingType(SkillLocation skillA, SkillLocation skillB);
}
