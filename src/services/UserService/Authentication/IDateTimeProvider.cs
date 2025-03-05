namespace UserService.Authentication;

public interface IDateTimeProvider
{
    DateTime UtcNow { get; }
}
