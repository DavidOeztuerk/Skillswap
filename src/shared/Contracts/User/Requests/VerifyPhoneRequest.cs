namespace Contracts.User.Requests;

/// <summary>
/// Request to verify phone number with code
/// </summary>
public record VerifyPhoneRequest(
    string Code
);