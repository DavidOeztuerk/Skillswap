using CQRS.Handlers;
using SkillService.Application.Queries;
using CQRS.Models;
using Contracts.Skill.Responses;
using SkillService.Domain.Repositories;
using Microsoft.Extensions.Logging;

namespace SkillService.Application.QueryHandlers;

public class GetUserSkillsQueryHandler(
    ISkillUnitOfWork unitOfWork,
    ILogger<GetUserSkillsQueryHandler> logger)
    : BasePagedQueryHandler<
    GetUserSkillsQuery,
    UserSkillResponse>(
        logger)
{
    private readonly ISkillUnitOfWork _unitOfWork = unitOfWork;

    public override async Task<PagedResponse<UserSkillResponse>> Handle(
        GetUserSkillsQuery request,
        CancellationToken cancellationToken)
    {
        {
            // Get all user skills (will be filtered in Infrastructure with proper joins)
            var allUserSkills = await _unitOfWork.Skills
                .GetUserSkillsAsync(request.UserId, cancellationToken);

            // Apply filters in-memory (TODO: Move to repository for better performance)
            var filteredSkills = allUserSkills.AsQueryable();

            if (!request.IncludeInactive)
            {
                filteredSkills = filteredSkills.Where(s => s.IsActive);
            }

            if (request.IsOffered.HasValue)
            {
                filteredSkills = filteredSkills.Where(s => s.IsOffered == request.IsOffered.Value);
            }

            if (!string.IsNullOrEmpty(request.CategoryId))
            {
                filteredSkills = filteredSkills.Where(s => s.SkillCategoryId == request.CategoryId);
            }

            if (!string.IsNullOrEmpty(request.ProficiencyLevelId))
            {
                filteredSkills = filteredSkills.Where(s => s.ProficiencyLevelId == request.ProficiencyLevelId);
            }

            var orderedSkills = filteredSkills.OrderByDescending(s => s.CreatedAt).ToList();
            var totalRecords = orderedSkills.Count;

            // Get related entities for the paginated results
            var pagedSkills = orderedSkills
                .Skip((request.PageNumber - 1) * request.PageSize)
                .Take(request.PageSize)
                .ToList();

            var skills = new List<UserSkillResponse>();
            foreach (var s in pagedSkills)
            {
                var category = await _unitOfWork.SkillCategories.GetByIdAsync(s.SkillCategoryId, cancellationToken);
                var proficiency = await _unitOfWork.ProficiencyLevels.GetByIdAsync(s.ProficiencyLevelId, cancellationToken);

                skills.Add(new UserSkillResponse(
                    s.UserId,
                    s.Id,
                    s.Name,
                    s.Description,
                    new SkillCategoryResponse(
                        category?.Id ?? s.SkillCategoryId,
                        category?.Name ?? "Unknown",
                        category?.IconName ?? "",
                        category?.Color ?? "",
                        0),
                    new ProficiencyLevelResponse(
                        proficiency?.Id ?? s.ProficiencyLevelId,
                        proficiency?.Level ?? "Unknown",
                        proficiency?.Rank ?? 0,
                        proficiency?.Color ?? "",
                        0),
                    s.Tags,
                    s.IsOffered,
                    s.AverageRating,
                    s.ReviewCount,
                    s.EndorsementCount,
                    s.CreatedAt,
                    s.UpdatedAt ?? s.CreatedAt));
            }

            return Success(skills, request.PageNumber, request.PageSize, totalRecords);
        }
    }
}
