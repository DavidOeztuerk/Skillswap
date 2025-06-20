
// ============================================================================
// QUERY HANDLERS
// ============================================================================
// File: src/services/NotificationService/Application/Handlers/GetNotificationPreferencesQueryHandler.cs

using CQRS.Handlers;
using Infrastructure.Models;
using Microsoft.EntityFrameworkCore;
using NotificationService.Application.Queries;
using NotificationService.Domain.ResponseModels;
using NotificationService.Infrastructure.Data;

namespace NotificationService.Application.QueryHandlers;

public class GetEmailTemplatesQueryHandler(
    NotificationDbContext context,
    ILogger<GetEmailTemplatesQueryHandler> logger)
    : BasePagedQueryHandler<GetEmailTemplatesQuery, EmailTemplateResponse>(logger)
{
    private readonly NotificationDbContext _context = context;

    public override async Task<PagedResponse<EmailTemplateResponse>> Handle(
        GetEmailTemplatesQuery request,
        CancellationToken cancellationToken)
    {
        try
        {
            var query = _context.EmailTemplates
                .Where(t => !t.IsDeleted);

            // Apply filters
            if (!string.IsNullOrEmpty(request.Language))
            {
                query = query.Where(t => t.Language == request.Language);
            }

            if (request.IsActive.HasValue)
            {
                query = query.Where(t => t.IsActive == request.IsActive.Value);
            }

            // Get total count
            var totalCount = await query.CountAsync(cancellationToken);

            // Apply pagination
            var templates = await query
                .OrderBy(t => t.Name)
                .ThenBy(t => t.Language)
                .Skip((request.Page - 1) * request.PageSize)
                .Take(request.PageSize)
                .Select(t => new EmailTemplateResponse
                {
                    Id = t.Id,
                    Name = t.Name,
                    Language = t.Language,
                    Subject = t.Subject,
                    Description = t.Description,
                    IsActive = t.IsActive,
                    Version = t.Version,
                    CreatedAt = t.CreatedAt,
                    UpdatedAt = t.UpdatedAt ?? DateTime.UtcNow,
                })
                .ToListAsync(cancellationToken);

            return Success(
                templates,
                request.Page,
                request.PageSize,
                totalCount
            );
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error retrieving email templates");
            return Error("An error occurred while retrieving email templates");
        }
    }
}
