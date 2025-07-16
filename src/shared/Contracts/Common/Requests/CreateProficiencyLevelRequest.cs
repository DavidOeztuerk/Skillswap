namespace Contracts.Requests;

public record CreateProficiencyLevelRequest(
    string Level,
    int Rank);
