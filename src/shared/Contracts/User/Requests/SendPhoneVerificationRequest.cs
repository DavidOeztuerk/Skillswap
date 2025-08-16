namespace Contracts.User.Requests;

/// <summary>
/// Request to send phone verification code
/// </summary>
public record SendPhoneVerificationRequest(
    string PhoneNumber
);