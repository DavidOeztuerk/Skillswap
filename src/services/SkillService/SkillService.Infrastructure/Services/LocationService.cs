using System.Globalization;
using System.Net.Http.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging;
using SkillService.Application.Services;

namespace SkillService.Infrastructure.Services;

/// <summary>
/// Location service implementation using Nominatim for geocoding
/// </summary>
public class LocationService : ILocationService
{
    private readonly HttpClient _httpClient;
    private readonly IDistributedCache _cache;
    private readonly ILogger<LocationService> _logger;

    // Earth's radius in kilometers (for Haversine formula)
    private const double EarthRadiusKm = 6371.0;

    // Cache duration for geocoding results (7 days - addresses don't change often)
    private static readonly TimeSpan CacheDuration = TimeSpan.FromDays(7);

    // Nominatim rate limit protection (last request timestamp)
    private static DateTime _lastNominatimRequest = DateTime.MinValue;
    private static readonly SemaphoreSlim _nominatimSemaphore = new(1, 1);

    public LocationService(
        HttpClient httpClient,
        IDistributedCache cache,
        ILogger<LocationService> logger)
    {
        _httpClient = httpClient;
        _cache = cache;
        _logger = logger;

        // Configure HttpClient for Nominatim
        _httpClient.BaseAddress = new Uri("https://nominatim.openstreetmap.org/");
        _httpClient.DefaultRequestHeaders.Add("User-Agent", "Skillswap/1.0 (contact@skillswap.app)");
    }

    /// <inheritdoc />
    public async Task<GeoCoordinate?> GeocodeAddressAsync(
        string? postalCode,
        string? city,
        string? country,
        CancellationToken cancellationToken = default)
    {
        // Skip geocoding for remote-only skills or missing data
        if (string.IsNullOrEmpty(city) && string.IsNullOrEmpty(postalCode))
        {
            _logger.LogDebug("Skipping geocoding: no city or postal code provided");
            return null;
        }

        // Build cache key
        var cacheKey = $"geocode:{country ?? ""}:{postalCode ?? ""}:{city ?? ""}".ToLowerInvariant();

        // Try cache first
        var cachedResult = await _cache.GetStringAsync(cacheKey, cancellationToken);
        if (!string.IsNullOrEmpty(cachedResult))
        {
            var parts = cachedResult.Split(',');
            if (parts.Length == 2 &&
                double.TryParse(parts[0], NumberStyles.Float, CultureInfo.InvariantCulture, out var cachedLat) &&
                double.TryParse(parts[1], NumberStyles.Float, CultureInfo.InvariantCulture, out var cachedLng))
            {
                _logger.LogDebug("Geocode cache hit for {CacheKey}", cacheKey);
                return new GeoCoordinate(cachedLat, cachedLng);
            }
        }

        // Rate limit protection (1 request per second for Nominatim)
        await _nominatimSemaphore.WaitAsync(cancellationToken);
        try
        {
            var timeSinceLastRequest = DateTime.UtcNow - _lastNominatimRequest;
            if (timeSinceLastRequest < TimeSpan.FromSeconds(1))
            {
                await Task.Delay(TimeSpan.FromSeconds(1) - timeSinceLastRequest, cancellationToken);
            }

            // Build search query
            var queryParts = new List<string>();
            if (!string.IsNullOrEmpty(postalCode)) queryParts.Add(postalCode);
            if (!string.IsNullOrEmpty(city)) queryParts.Add(city);
            if (!string.IsNullOrEmpty(country)) queryParts.Add(country);

            var query = Uri.EscapeDataString(string.Join(", ", queryParts));
            var requestUrl = $"search?q={query}&format=json&limit=1";

            _logger.LogDebug("Geocoding request: {Url}", requestUrl);

            var response = await _httpClient.GetAsync(requestUrl, cancellationToken);
            _lastNominatimRequest = DateTime.UtcNow;

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Nominatim returned {StatusCode} for query: {Query}",
                    response.StatusCode, query);
                return null;
            }

            var results = await response.Content.ReadFromJsonAsync<NominatimResult[]>(cancellationToken);
            if (results == null || results.Length == 0)
            {
                _logger.LogDebug("No geocoding results for: {Query}", query);
                return null;
            }

            var result = results[0];
            if (!double.TryParse(result.Lat, NumberStyles.Float, CultureInfo.InvariantCulture, out var lat) ||
                !double.TryParse(result.Lon, NumberStyles.Float, CultureInfo.InvariantCulture, out var lng))
            {
                _logger.LogWarning("Invalid coordinates from Nominatim: lat={Lat}, lon={Lon}",
                    result.Lat, result.Lon);
                return null;
            }

            // Cache the result
            await _cache.SetStringAsync(
                cacheKey,
                $"{lat},{lng}",
                new DistributedCacheEntryOptions { AbsoluteExpirationRelativeToNow = CacheDuration },
                cancellationToken);

            _logger.LogInformation("Geocoded {Query} to ({Lat}, {Lng})", query, lat, lng);
            return new GeoCoordinate(lat, lng);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Geocoding failed for {City}, {PostalCode}, {Country}",
                city, postalCode, country);
            return null;
        }
        finally
        {
            _nominatimSemaphore.Release();
        }
    }

    /// <inheritdoc />
    public double CalculateDistanceKm(GeoCoordinate a, GeoCoordinate b)
    {
        // Haversine formula for distance on a sphere
        var lat1Rad = DegreesToRadians(a.Latitude);
        var lat2Rad = DegreesToRadians(b.Latitude);
        var deltaLat = DegreesToRadians(b.Latitude - a.Latitude);
        var deltaLon = DegreesToRadians(b.Longitude - a.Longitude);

        var haversine = Math.Sin(deltaLat / 2) * Math.Sin(deltaLat / 2) +
                        Math.Cos(lat1Rad) * Math.Cos(lat2Rad) *
                        Math.Sin(deltaLon / 2) * Math.Sin(deltaLon / 2);

        var c = 2 * Math.Atan2(Math.Sqrt(haversine), Math.Sqrt(1 - haversine));

        return EarthRadiusKm * c;
    }

    /// <inheritdoc />
    public bool AreLocationsCompatible(SkillLocation skillA, SkillLocation skillB)
    {
        // Compatibility matrix:
        // remote + remote = YES
        // remote + in_person = NO
        // remote + both = YES (remote possible)
        // in_person + in_person = YES (if within distance)
        // in_person + both = YES (if within distance)
        // both + both = YES

        var typeA = skillA.LocationType.ToLowerInvariant();
        var typeB = skillB.LocationType.ToLowerInvariant();

        // Both remote -> always compatible
        if (typeA == "remote" && typeB == "remote")
            return true;

        // One remote, one in_person only -> incompatible
        if ((typeA == "remote" && typeB == "in_person") ||
            (typeA == "in_person" && typeB == "remote"))
            return false;

        // At least one is "both" -> check if remote is possible OR in_person is within distance
        if (typeA == "both" || typeB == "both")
        {
            // If remote is an option for either, it's compatible
            if (typeA == "remote" || typeB == "remote" ||
                typeA == "both" || typeB == "both")
            {
                // If one is remote-only, remote works
                if (typeA == "remote" || typeB == "remote")
                    return true;

                // Both can do in_person, check distance
                return AreWithinDistance(skillA, skillB);
            }
        }

        // Both in_person -> check distance
        if (typeA == "in_person" && typeB == "in_person")
        {
            return AreWithinDistance(skillA, skillB);
        }

        // Fallback: if both have "both", they're compatible (can meet remotely or in person)
        return typeA == "both" && typeB == "both";
    }

    /// <inheritdoc />
    public string GetEffectiveMeetingType(SkillLocation skillA, SkillLocation skillB)
    {
        var typeA = skillA.LocationType.ToLowerInvariant();
        var typeB = skillB.LocationType.ToLowerInvariant();

        // If either is remote-only, meeting is remote
        if (typeA == "remote" || typeB == "remote")
            return "remote";

        // If both can do in_person (in_person or both), check if within distance
        if ((typeA == "in_person" || typeA == "both") &&
            (typeB == "in_person" || typeB == "both"))
        {
            if (AreWithinDistance(skillA, skillB))
                return "in_person";

            // Out of range, fallback to remote if possible
            if (typeA == "both" || typeB == "both")
                return "remote";
        }

        // Default to remote
        return "remote";
    }

    private bool AreWithinDistance(SkillLocation skillA, SkillLocation skillB)
    {
        // Need coordinates for both
        if (!skillA.Latitude.HasValue || !skillA.Longitude.HasValue ||
            !skillB.Latitude.HasValue || !skillB.Longitude.HasValue)
        {
            // No coordinates, assume incompatible for in_person
            _logger.LogDebug("Cannot calculate distance: missing coordinates");
            return false;
        }

        var coordA = new GeoCoordinate(skillA.Latitude.Value, skillA.Longitude.Value);
        var coordB = new GeoCoordinate(skillB.Latitude.Value, skillB.Longitude.Value);

        var distance = CalculateDistanceKm(coordA, coordB);

        // Use the smaller maxDistance of the two
        var maxDistance = Math.Min(skillA.MaxDistanceKm, skillB.MaxDistanceKm);

        var isWithin = distance <= maxDistance;
        _logger.LogDebug("Distance check: {Distance:F1}km <= {MaxDistance}km = {Result}",
            distance, maxDistance, isWithin);

        return isWithin;
    }

    private static double DegreesToRadians(double degrees) => degrees * Math.PI / 180.0;

    /// <summary>
    /// Nominatim API response model
    /// </summary>
    private class NominatimResult
    {
        [JsonPropertyName("lat")]
        public string Lat { get; set; } = string.Empty;

        [JsonPropertyName("lon")]
        public string Lon { get; set; } = string.Empty;

        [JsonPropertyName("display_name")]
        public string DisplayName { get; set; } = string.Empty;
    }
}
