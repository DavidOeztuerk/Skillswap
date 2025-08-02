namespace Contracts.User.Responses.Auth;

public enum AccountStatus 
{
    PendingVerification = 0,  // This becomes the CLR default
    Active = 1,
    Suspended = 2,
    Inactive = 3,
    Banned = 4,
    Deleted = 5
}
