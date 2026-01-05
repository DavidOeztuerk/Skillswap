using CQRS.Handlers;
using SkillService.Application.Commands;
using SkillService.Application.Services;
using SkillService.Domain.Entities;
using SkillService.Domain.Repositories;
using Contracts.Skill.Responses;
using CQRS.Models;
using Core.Common.Exceptions;
using Events.Integration.SkillManagement;
using MassTransit;
using Microsoft.Extensions.Logging;

namespace SkillService.Application.CommandHandlers;

public class CreateSkillCommandHandler(
    ISkillUnitOfWork unitOfWork,
    ILocationService locationService,
    IPublishEndpoint publishEndpoint,
    ILogger<CreateSkillCommandHandler> logger)
    : BaseCommandHandler<CreateSkillCommand, CreateSkillResponse>(logger)
{
    private readonly ISkillUnitOfWork _unitOfWork = unitOfWork;
    private readonly ILocationService _locationService = locationService;
    private readonly IPublishEndpoint _publishEndpoint = publishEndpoint;

    public override async Task<ApiResponse<CreateSkillResponse>> Handle(
        CreateSkillCommand request,
        CancellationToken cancellationToken)
    {
        if (request.UserId == null)
        {
            throw new ArgumentNullException(nameof(request), "UserId cannot be null when creating a skill.");
        }

        // Validate category exists
        var category = await _unitOfWork.SkillCategories.GetByIdAsync(request.CategoryId, cancellationToken) ?? throw new ResourceNotFoundException("SkillCategory", request.CategoryId);

        // Validate proficiency level exists
        var proficiencyLevel = await _unitOfWork.ProficiencyLevels.GetByIdAsync(request.ProficiencyLevelId, cancellationToken) ?? throw new ResourceNotFoundException("ProficiencyLevel", request.ProficiencyLevelId);

        // Check for similar skills by the same user
        var existingSkill = await _unitOfWork.Skills.GetByNameAndUserIdAsync(request.Name.Trim(), request.UserId, cancellationToken);

        if (existingSkill != null)
        {
            throw new ResourceAlreadyExistsException(
                "Skill", 
                "Name", 
                request.Name, 
                "You already have a similar skill. Consider updating your existing skill instead.");
        }

        // Geocode location if in_person or both (async, during skill creation - NOT during matching!)
        double? latitude = null;
        double? longitude = null;

        var locationType = request.LocationType?.ToLowerInvariant() ?? "remote";
        if (locationType is "in_person" or "both" &&
            (!string.IsNullOrEmpty(request.LocationCity) || !string.IsNullOrEmpty(request.LocationPostalCode)))
        {
            try
            {
                var geoResult = await _locationService.GeocodeAddressAsync(
                    request.LocationPostalCode,
                    request.LocationCity,
                    request.LocationCountry,
                    cancellationToken);

                if (geoResult != null)
                {
                    latitude = geoResult.Latitude;
                    longitude = geoResult.Longitude;
                    Logger.LogInformation("Geocoded location for skill: ({Lat}, {Lng})", latitude, longitude);
                }
                else
                {
                    Logger.LogWarning("Could not geocode location for skill: {City}, {PostalCode}, {Country}",
                        request.LocationCity, request.LocationPostalCode, request.LocationCountry);
                }
            }
            catch (Exception ex)
            {
                // Don't fail skill creation if geocoding fails
                Logger.LogError(ex, "Geocoding failed, continuing without coordinates");
            }
        }

        // Create new skill with all fields
        var skill = new Skill
        {
            UserId = request.UserId,
            Name = request.Name.Trim(),
            Description = request.Description.Trim(),
            IsOffered = request.IsOffered,
            SkillCategoryId = request.CategoryId,
            ProficiencyLevelId = request.ProficiencyLevelId,
            Tags = request.Tags ?? [],
            IsActive = true,
            SearchKeywords = GenerateSearchKeywords(request.Name, request.Description, request.Tags),
            CreatedBy = request.UserId,

            // Exchange options
            ExchangeType = request.ExchangeType?.ToLowerInvariant() ?? "skill_exchange",
            DesiredSkillCategoryId = request.DesiredSkillCategoryId,
            DesiredSkillDescription = request.DesiredSkillDescription?.Trim(),
            HourlyRate = request.HourlyRate,
            Currency = request.Currency?.ToUpperInvariant(),

            // Scheduling
            PreferredDays = request.PreferredDays ?? [],
            PreferredTimes = request.PreferredTimes ?? [],
            SessionDurationMinutes = request.SessionDurationMinutes,
            TotalSessions = request.TotalSessions,

            // Location
            LocationType = locationType,
            LocationAddress = request.LocationAddress?.Trim(),
            LocationCity = request.LocationCity?.Trim(),
            LocationPostalCode = request.LocationPostalCode?.Trim(),
            LocationCountry = request.LocationCountry?.ToUpperInvariant(),
            MaxDistanceKm = request.MaxDistanceKm,
            LocationLatitude = latitude,
            LocationLongitude = longitude
        };

        await _unitOfWork.Skills.CreateAsync(skill, cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        Logger.LogInformation("Skill {SkillName} created successfully by user {UserId}",
            skill.Name, request.UserId);

        // Publish integration event for automatic matchmaking
        var integrationEvent = new SkillCreatedEvent
        {
            SkillId = skill.Id,
            UserId = skill.UserId,
            Name = skill.Name,
            Description = skill.Description,
            CategoryId = category.Id,
            CategoryName = category.Name,
            ProficiencyLevelId = proficiencyLevel.Id,
            ProficiencyLevelRank = proficiencyLevel.Rank,
            IsOffered = skill.IsOffered,
            ExchangeType = skill.ExchangeType,
            DesiredSkillCategoryId = skill.DesiredSkillCategoryId,
            DesiredSkillDescription = skill.DesiredSkillDescription,
            HourlyRate = skill.HourlyRate,
            Currency = skill.Currency,
            PreferredDays = skill.PreferredDays.ToArray(),
            PreferredTimes = skill.PreferredTimes.ToArray(),
            SessionDurationMinutes = skill.SessionDurationMinutes,
            TotalSessions = skill.TotalSessions,
            LocationType = skill.LocationType,
            LocationCity = skill.LocationCity,
            LocationPostalCode = skill.LocationPostalCode,
            LocationCountry = skill.LocationCountry,
            MaxDistanceKm = skill.MaxDistanceKm,
            LocationLatitude = skill.LocationLatitude,
            LocationLongitude = skill.LocationLongitude,
            CreatedAt = skill.CreatedAt
        };

        await _publishEndpoint.Publish(integrationEvent, cancellationToken);
        Logger.LogInformation("Published SkillCreatedEvent for SkillId: {SkillId}", skill.Id);

        var response = new CreateSkillResponse(
            skill.Id,
            skill.Name,
            skill.Description,
            category.Id,
            proficiencyLevel.Id,
            skill.Tags,
            skill.IsOffered,
            "Active",
            skill.CreatedAt);

        return Success(response, "Skill created successfully");
    }

    private static string GenerateSearchKeywords(string name, string description, List<string>? tags)
    {
        var keywords = new List<string> { name };

        // Add significant words from description
        var descriptionWords = description.Split(' ', StringSplitOptions.RemoveEmptyEntries)
            .Where(w => w.Length > 3)
            .Take(10);
        keywords.AddRange(descriptionWords);

        // Add tags
        if (tags != null)
        {
            keywords.AddRange(tags);
        }

        return string.Join(" ", keywords.Distinct()).ToLowerInvariant();
    }
}
