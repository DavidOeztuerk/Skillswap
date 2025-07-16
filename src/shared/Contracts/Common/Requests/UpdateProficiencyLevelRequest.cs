namespace Contracts.Requests;

public record UpdateProficiencyLevelRequest(
    string Level,
    int Rank);
