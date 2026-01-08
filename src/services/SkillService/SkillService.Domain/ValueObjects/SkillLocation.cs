namespace SkillService.Domain.ValueObjects;

/// <summary>
/// Value Object for skill location configuration.
/// Stored as owned entity in Skill table.
/// </summary>
public class SkillLocation
{
    /// <summary>
    /// Location type: remote (default), in_person, or both
    /// </summary>
    public string LocationType { get; private set; } = "remote";

    /// <summary>
    /// For in_person: Street address
    /// </summary>
    public string? Address { get; private set; }

    /// <summary>
    /// For in_person: City name
    /// </summary>
    public string? City { get; private set; }

    /// <summary>
    /// For in_person: Postal code (required for distance calculation)
    /// </summary>
    public string? PostalCode { get; private set; }

    /// <summary>
    /// For in_person: Country code (ISO 3166-1 alpha-2, e.g., "DE")
    /// </summary>
    public string? Country { get; private set; }

    /// <summary>
    /// Maximum distance in km for in_person matching (default: 50)
    /// </summary>
    public int MaxDistanceKm { get; private set; } = 50;

    /// <summary>
    /// Geocoded latitude (cached from Nominatim on skill creation)
    /// </summary>
    public double? Latitude { get; private set; }

    /// <summary>
    /// Geocoded longitude (cached from Nominatim on skill creation)
    /// </summary>
    public double? Longitude { get; private set; }

    // Required for EF Core
    private SkillLocation() { }

    public static SkillLocation CreateRemote()
    {
        return new SkillLocation
        {
            LocationType = "remote"
        };
    }

    public static SkillLocation CreateInPerson(
        string? address,
        string? city,
        string? postalCode,
        string? country,
        int maxDistanceKm = 50,
        double? latitude = null,
        double? longitude = null)
    {
        return new SkillLocation
        {
            LocationType = "in_person",
            Address = address,
            City = city,
            PostalCode = postalCode,
            Country = country,
            MaxDistanceKm = maxDistanceKm,
            Latitude = latitude,
            Longitude = longitude
        };
    }

    public static SkillLocation CreateBoth(
        string? address,
        string? city,
        string? postalCode,
        string? country,
        int maxDistanceKm = 50,
        double? latitude = null,
        double? longitude = null)
    {
        return new SkillLocation
        {
            LocationType = "both",
            Address = address,
            City = city,
            PostalCode = postalCode,
            Country = country,
            MaxDistanceKm = maxDistanceKm,
            Latitude = latitude,
            Longitude = longitude
        };
    }

    public static SkillLocation Default() => CreateRemote();

    // Helper properties
    public bool IsRemote => LocationType == "remote";
    public bool IsInPerson => LocationType == "in_person";
    public bool IsBoth => LocationType == "both";
    public bool HasGeoLocation => Latitude.HasValue && Longitude.HasValue;

    public void Update(
        string locationType,
        string? address,
        string? city,
        string? postalCode,
        string? country,
        int maxDistanceKm,
        double? latitude,
        double? longitude)
    {
        LocationType = locationType;
        Address = address;
        City = city;
        PostalCode = postalCode;
        Country = country;
        MaxDistanceKm = maxDistanceKm;
        Latitude = latitude;
        Longitude = longitude;
    }

    public void SetGeoLocation(double latitude, double longitude)
    {
        Latitude = latitude;
        Longitude = longitude;
    }

    public void ClearGeoLocation()
    {
        Latitude = null;
        Longitude = null;
    }
}
