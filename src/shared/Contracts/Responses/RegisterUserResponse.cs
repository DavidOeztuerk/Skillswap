namespace Contracts.Responses;

public record RegisterUserResponse(
    string Email,
    string FirstName,
    string LastName,
    string Token);
