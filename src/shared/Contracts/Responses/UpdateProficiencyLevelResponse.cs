namespace Contracts.Responses;

public record UpdateProficiencyLevelResponse(
    string Id,
    string Level,
    int Rank);