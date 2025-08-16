namespace UserService.Api.Models;

public class SendPhoneVerificationRequest
{
    public string PhoneNumber { get; set; } = string.Empty;
}

public class VerifyPhoneRequest
{
    public string Code { get; set; } = string.Empty;
}