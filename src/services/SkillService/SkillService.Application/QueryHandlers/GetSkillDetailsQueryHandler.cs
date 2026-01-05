using CQRS.Handlers;
using Microsoft.Extensions.Logging;
using SkillService.Application.Queries;
using CQRS.Models;
using Contracts.Skill.Responses;
using SkillService.Domain.Repositories;
using SkillService.Domain.Services;

namespace SkillService.Application.QueryHandlers;

public class GetSkillDetailsQueryHandler(
    ISkillUnitOfWork unitOfWork,
    IUserServiceClient userServiceClient,
    ILogger<GetSkillDetailsQueryHandler> logger)
    : BaseQueryHandler<
    GetSkillDetailsQuery,
    SkillDetailsResponse>(
        logger)
{
    private readonly ISkillUnitOfWork _unitOfWork = unitOfWork;
    private readonly IUserServiceClient _userServiceClient = userServiceClient;

    public override async Task<ApiResponse<SkillDetailsResponse>> Handle(
        GetSkillDetailsQuery request,
        CancellationToken cancellationToken)
    {
        {
            var skill = await _unitOfWork.Skills
                .GetByIdAsync(request.SkillId, cancellationToken);

            if (skill == null)
            {
                return NotFound("Skill not found");
            }

            // Load related entities
            var category = await _unitOfWork.SkillCategories.GetByIdAsync(skill.SkillCategoryId, cancellationToken);
            var proficiency = await _unitOfWork.ProficiencyLevels.GetByIdAsync(skill.ProficiencyLevelId, cancellationToken);

            // Fetch owner details from UserService
            var ownerProfile = await _userServiceClient.GetUserProfileAsync(skill.UserId, cancellationToken);
            string? ownerUserName = ownerProfile?.UserName;
            string? ownerFirstName = ownerProfile?.FirstName;
            string? ownerLastName = ownerProfile?.LastName;
            double? ownerRating = ownerProfile?.AverageRating;
            DateTime? ownerMemberSince = ownerProfile?.MemberSince;

            var response = new SkillDetailsResponse(
                skill.Id,
                skill.UserId,
                ownerUserName,
                ownerFirstName,
                ownerLastName,
                ownerRating,
                ownerMemberSince,
                skill.Name,
                skill.Description,
                new SkillCategoryResponse(
                    category?.Id ?? skill.SkillCategoryId,
                    category?.Name ?? "Unknown",
                    category?.IconName ?? "",
                    category?.Color ?? "",
                    0),
                new ProficiencyLevelResponse(
                    proficiency?.Id ?? skill.ProficiencyLevelId,
                    proficiency?.Level ?? "Unknown",
                    proficiency?.Rank ?? 0,
                    proficiency?.Color ?? "",
                    0),
                skill.Tags,
                skill.IsOffered,
                skill.AverageRating != null ? (decimal)skill.AverageRating : null,
                new List<SkillReviewResponse>(), // TODO: Load reviews separately
                new List<SkillEndorsementResponse>(), // TODO: Load endorsements separately
                null, // AvailableHours - not stored in skill entity
                skill.EstimatedDurationMinutes,
                skill.IsActive ? "Active" : "Inactive",
                skill.CreatedAt,
                skill.UpdatedAt ?? skill.CreatedAt,
                // Exchange options
                skill.ExchangeType,
                skill.DesiredSkillCategoryId,
                skill.DesiredSkillDescription,
                skill.HourlyRate,
                skill.Currency,
                // Scheduling
                skill.PreferredDays,
                skill.PreferredTimes,
                skill.SessionDurationMinutes,
                skill.TotalSessions,
                // Location
                skill.LocationType,
                skill.LocationAddress,
                skill.LocationCity,
                skill.LocationPostalCode,
                skill.LocationCountry,
                skill.MaxDistanceKm);

            return Success(response);
        }
    }
}
