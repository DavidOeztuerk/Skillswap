using NotificationService.Domain.Entities;

namespace NotificationService.Domain.Repositories;

public interface IEmailTemplateRepository
{
    Task<EmailTemplate?> GetByIdAsync(string templateId, CancellationToken cancellationToken = default);
    Task<EmailTemplate?> GetByNameAsync(string templateName, CancellationToken cancellationToken = default);
    Task<List<EmailTemplate>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<EmailTemplate> CreateAsync(EmailTemplate template, CancellationToken cancellationToken = default);
    Task<EmailTemplate> UpdateAsync(EmailTemplate template, CancellationToken cancellationToken = default);
    Task DeleteAsync(string templateId, CancellationToken cancellationToken = default);
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
