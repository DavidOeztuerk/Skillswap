namespace UserService.Domain.Enums;

public enum AccountStatus
{
    PendingVerification = 0,
    Active = 1,
    Suspended = 2,
    Inactive = 3,
    Banned = 4,
    Deleted = 5
}
