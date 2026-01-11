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
        // Get all user skills with related entities in single query (no N+1)
        var allUserSkills = await _unitOfWork.Skills
            .GetUserSkillsWithRelationsAsync(request.UserId, cancellationToken);

        // Apply filters in-memory
        var filteredSkills = allUserSkills.AsEnumerable();

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
            filteredSkills = filteredSkills.Where(s => s.SkillTopicId == request.CategoryId);
        }

        if (!string.IsNullOrEmpty(request.LocationType))
        {
            filteredSkills = filteredSkills.Where(s => s.LocationType == request.LocationType);
        }

        var skillsList = filteredSkills.ToList();
        var totalRecords = skillsList.Count;

        // Apply pagination
        var pagedSkills = skillsList
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToList();

        // Map to response - navigation properties already loaded
        var skills = pagedSkills.Select(s => new UserSkillResponse(
            s.UserId,
            s.Id,
            s.Name,
            s.Description,
            new SkillCategoryResponse(
                s.Topic?.Id ?? s.SkillTopicId,
                s.Topic?.FullPath ?? "Unknown",
                s.Topic?.IconName ?? "",
                s.Category?.Color ?? "",
                0),
            s.Tags,
            s.IsOffered,
            s.AverageRating,
            s.ReviewCount,
            s.EndorsementCount,
            s.CreatedAt,
            s.UpdatedAt ?? s.CreatedAt,
            // Location fields
            s.LocationType,
            s.LocationCity,
            s.LocationCountry,
            s.MaxDistanceKm)).ToList();

        return Success(skills, request.PageNumber, request.PageSize, totalRecords);
    }
}
