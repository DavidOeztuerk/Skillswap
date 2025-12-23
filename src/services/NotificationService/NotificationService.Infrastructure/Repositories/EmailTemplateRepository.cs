using Microsoft.EntityFrameworkCore;
using NotificationService.Domain.Entities;
using NotificationService.Domain.Repositories;
using NotificationService.Infrastructure.Data;

namespace NotificationService.Infrastructure.Repositories;

public class EmailTemplateRepository : IEmailTemplateRepository
{
    private readonly NotificationDbContext _dbContext;

    public EmailTemplateRepository(NotificationDbContext dbContext)
    {
        _dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
    }

    public async Task<EmailTemplate?> GetByIdAsync(string id, CancellationToken cancellationToken = default)
    {
        return await _dbContext.EmailTemplates
            .FirstOrDefaultAsync(e => e.Id == id, cancellationToken);
    }

    public async Task<EmailTemplate?> GetByNameAsync(string templateName, CancellationToken cancellationToken = default)
    {
        return await _dbContext.EmailTemplates
            .FirstOrDefaultAsync(t => t.Name == templateName && !t.IsDeleted, cancellationToken);
    }

    public async Task<List<EmailTemplate>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _dbContext.EmailTemplates
            .Where(t => !t.IsDeleted)
            .ToListAsync(cancellationToken);
    }

    public async Task<EmailTemplate> CreateAsync(EmailTemplate entity, CancellationToken cancellationToken = default)
    {
        await _dbContext.EmailTemplates.AddAsync(entity, cancellationToken);
        return entity;
    }

    public async Task<EmailTemplate> UpdateAsync(EmailTemplate entity, CancellationToken cancellationToken = default)
    {
        _dbContext.EmailTemplates.Update(entity);
        return await Task.FromResult(entity);
    }

    public async Task DeleteAsync(string id, CancellationToken cancellationToken = default)
    {
        var entity = await GetByIdAsync(id, cancellationToken);
        if (entity != null)
        {
            _dbContext.EmailTemplates.Remove(entity);
        }
    }

    public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return await _dbContext.SaveChangesAsync(cancellationToken);
    }
}
