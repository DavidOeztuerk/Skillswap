using Bogus;
using System.Text.Json;

namespace Testing;

/// <summary>
/// Test data builders using Bogus for consistent test data generation
/// </summary>
public static class TestDataBuilders
{
    private static readonly Faker _faker = new();

    /// <summary>
    /// Creates a faker for generating test users
    /// </summary>
    public static Faker<T> CreateUserFaker<T>() where T : class, new()
    {
        return new Faker<T>()
            .RuleFor("Id", f => f.Random.Guid())
            .RuleFor("FirstName", f => f.Name.FirstName())
            .RuleFor("LastName", f => f.Name.LastName())
            .RuleFor("Email", f => f.Internet.Email())
            .RuleFor("CreatedAt", f => f.Date.Recent())
            .RuleFor("UpdatedAt", f => f.Date.Recent());
    }

    /// <summary>
    /// Creates a faker for generating test skills
    /// </summary>
    public static Faker<T> CreateSkillFaker<T>() where T : class, new()
    {
        return new Faker<T>()
            .RuleFor("Id", f => f.Random.Guid())
            .RuleFor("Name", f => f.Commerce.Product())
            .RuleFor("Description", f => f.Lorem.Sentence())
            .RuleFor("Tags", f => f.Lorem.Words(3).ToArray())
            .RuleFor("IsOffering", f => f.Random.Bool())
            .RuleFor("IsRequesting", f => f.Random.Bool())
            .RuleFor("IsRemote", f => f.Random.Bool())
            .RuleFor("CreatedAt", f => f.Date.Recent())
            .RuleFor("UpdatedAt", f => f.Date.Recent());
    }

    /// <summary>
    /// Creates a faker for generating test appointments
    /// </summary>
    public static Faker<T> CreateAppointmentFaker<T>() where T : class, new()
    {
        return new Faker<T>()
            .RuleFor("Id", f => f.Random.Guid())
            .RuleFor("Title", f => f.Lorem.Sentence())
            .RuleFor("Description", f => f.Lorem.Paragraph())
            .RuleFor("StartTime", f => f.Date.Future())
            .RuleFor("EndTime", f => f.Date.Future())
            .RuleFor("IsOnline", f => f.Random.Bool())
            .RuleFor("MeetingUrl", f => f.Internet.Url())
            .RuleFor("CreatedAt", f => f.Date.Recent())
            .RuleFor("UpdatedAt", f => f.Date.Recent());
    }

    /// <summary>
    /// Creates a faker for generating test matches
    /// </summary>
    public static Faker<T> CreateMatchFaker<T>() where T : class, new()
    {
        return new Faker<T>()
            .RuleFor("Id", f => f.Random.Guid())
            .RuleFor("CompatibilityScore", f => f.Random.Double(0, 100))
            .RuleFor("CreatedAt", f => f.Date.Recent())
            .RuleFor("UpdatedAt", f => f.Date.Recent());
    }

    /// <summary>
    /// Creates a faker for generating test notifications
    /// </summary>
    public static Faker<T> CreateNotificationFaker<T>() where T : class, new()
    {
        return new Faker<T>()
            .RuleFor("Id", f => f.Random.Guid())
            .RuleFor("Title", f => f.Lorem.Sentence())
            .RuleFor("Message", f => f.Lorem.Paragraph())
            .RuleFor("IsRead", f => f.Random.Bool())
            .RuleFor("CreatedAt", f => f.Date.Recent())
            .RuleFor("UpdatedAt", f => f.Date.Recent());
    }

    /// <summary>
    /// Generates random JSON data for testing
    /// </summary>
    public static string GenerateJsonData(object obj)
    {
        return JsonSerializer.Serialize(obj, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });
    }

    /// <summary>
    /// Generates a random email address
    /// </summary>
    public static string GenerateEmail() => _faker.Internet.Email();

    /// <summary>
    /// Generates a random password
    /// </summary>
    public static string GeneratePassword() => _faker.Internet.Password(8, false, "", "Aa1!");

    /// <summary>
    /// Generates a random UUID
    /// </summary>
    public static Guid GenerateGuid() => _faker.Random.Guid();

    /// <summary>
    /// Generates a random phone number
    /// </summary>
    public static string GeneratePhoneNumber() => _faker.Phone.PhoneNumber();

    /// <summary>
    /// Generates a random future date
    /// </summary>
    public static DateTime GenerateFutureDate() => _faker.Date.Future();

    /// <summary>
    /// Generates a random past date
    /// </summary>
    public static DateTime GeneratePastDate() => _faker.Date.Past();
}