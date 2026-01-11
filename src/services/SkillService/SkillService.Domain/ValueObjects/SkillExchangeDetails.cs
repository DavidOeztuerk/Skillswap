namespace SkillService.Domain.ValueObjects;

/// <summary>
/// Value Object for skill exchange configuration.
/// Stored as owned entity in Skill table.
/// </summary>
public class SkillExchangeDetails
{
    /// <summary>
    /// Type of exchange: skill_exchange (default) or payment
    /// Note: "free" is only for Public Workshops (separate epic)
    /// </summary>
    public string ExchangeType { get; private set; } = "skill_exchange";

    /// <summary>
    /// For skill_exchange: Topic of desired skill in return
    /// </summary>
    public string? DesiredSkillTopicId { get; private set; }

    /// <summary>
    /// For skill_exchange: Description of what skill is desired
    /// </summary>
    public string? DesiredSkillDescription { get; private set; }

    /// <summary>
    /// For payment: Hourly rate (only valid when IsOffered=true)
    /// </summary>
    public decimal? HourlyRate { get; private set; }

    /// <summary>
    /// For payment: Currency code (EUR, USD, CHF, GBP)
    /// </summary>
    public string? Currency { get; private set; }

    // Required for EF Core
    private SkillExchangeDetails() { }

    /// <summary>
    /// Parameter renamed from desiredCategoryId to desiredTopicId
    /// </summary>
    public static SkillExchangeDetails CreateSkillExchange(
        string? desiredTopicId = null,
        string? desiredDescription = null)
    {
        return new SkillExchangeDetails
        {
            ExchangeType = "skill_exchange",
            DesiredSkillTopicId = desiredTopicId,
            DesiredSkillDescription = desiredDescription,
            HourlyRate = null,
            Currency = null
        };
    }

    public static SkillExchangeDetails CreatePayment(
        decimal hourlyRate,
        string currency = "EUR")
    {
        if (hourlyRate <= 0)
            throw new ArgumentException("Hourly rate must be positive", nameof(hourlyRate));

        return new SkillExchangeDetails
        {
            ExchangeType = "payment",
            DesiredSkillTopicId = null,
            DesiredSkillDescription = null,
            HourlyRate = hourlyRate,
            Currency = currency
        };
    }

    public static SkillExchangeDetails Default() => CreateSkillExchange();

    // Helper properties
    public bool IsSkillExchange => ExchangeType == "skill_exchange";
    public bool IsPayment => ExchangeType == "payment";

    public void Update(
        string exchangeType,
        string? desiredTopicId,
        string? desiredDescription,
        decimal? hourlyRate,
        string? currency)
    {
        ExchangeType = exchangeType;
        DesiredSkillTopicId = desiredTopicId;
        DesiredSkillDescription = desiredDescription;
        HourlyRate = hourlyRate;
        Currency = currency;
    }
}
