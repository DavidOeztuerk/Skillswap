namespace Contracts.Requests;

public record LoginRequest(
    string Email,
    string Password);
