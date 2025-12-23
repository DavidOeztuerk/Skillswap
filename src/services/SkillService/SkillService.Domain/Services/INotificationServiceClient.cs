namespace SkillService.Domain.Services;

public interface INotificationServiceClient
{
    Task SendNotificationAsync(string userId, string message, CancellationToken cancellationToken = default);
}
