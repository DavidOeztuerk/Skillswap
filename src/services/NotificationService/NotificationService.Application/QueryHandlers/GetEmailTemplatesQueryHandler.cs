using CQRS.Handlers;
using Microsoft.Extensions.Logging;
using CQRS.Models;
using NotificationService.Application.Queries;
using NotificationService.Domain.ResponseModels;
using NotificationService.Domain.Repositories;
using Core.Common.Exceptions;

namespace NotificationService.Application.QueryHandlers;

public class GetEmailTemplatesQueryHandler(
    INotificationUnitOfWork unitOfWork,
    ILogger<GetEmailTemplatesQueryHandler> logger)
    : BasePagedQueryHandler<GetEmailTemplatesQuery, EmailTemplateResponse>(logger)
{
    private readonly INotificationUnitOfWork _unitOfWork = unitOfWork;

    public override async Task<PagedResponse<EmailTemplateResponse>> Handle(
        GetEmailTemplatesQuery request,
        CancellationToken cancellationToken)
    {
        try
        {
            var templates = await _unitOfWork.EmailTemplates
                .GetAllAsync(cancellationToken);

            // Apply filters
            if (!string.IsNullOrEmpty(request.Language))
            {
                templates = templates.Where(t => t.Language == request.Language).ToList();
            }

            if (request.IsActive.HasValue)
            {
                templates = templates.Where(t => t.IsActive == request.IsActive.Value).ToList();
            }

            // Get total count
            var totalCount = templates.Count;

            // Apply pagination
            var pagedTemplates = templates
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
                .ToList();

            return Success(
                pagedTemplates,
                request.Page,
                request.PageSize,
                totalCount
            );
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error retrieving email templates");
            return Error("An error occurred while retrieving email templates", ErrorCodes.InternalError);
        }
    }
}
