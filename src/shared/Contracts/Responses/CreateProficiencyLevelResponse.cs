namespace Contracts.Responses;

public record CreateProficiencyLevelResponse(
    string Id,
    string Level,
    int Rank);
