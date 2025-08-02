namespace Contracts.Matchmaking.Requests;

public class CreateCounterOfferRequest
{
    public string Message { get; set; } = string.Empty;
    
    // Tausch-Funktionalität
    public bool IsSkillExchange { get; set; } = false;
    public string? ExchangeSkillId { get; set; }
    public string? ExchangeSkillName { get; set; }
    
    // Monetäre Option
    public bool IsMonetaryOffer { get; set; } = false;
    public decimal? OfferedAmount { get; set; }
    
    // Zeitplanung
    public List<string> PreferredDays { get; set; } = new();
    public List<string> PreferredTimes { get; set; } = new();
    public int? SessionDurationMinutes { get; set; }
    public int? TotalSessions { get; set; }
}