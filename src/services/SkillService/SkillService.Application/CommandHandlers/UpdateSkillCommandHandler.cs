using CQRS.Handlers;
using SkillService.Application.Commands;
using EventSourcing;
using Events.Domain.Skill;
using Contracts.Skill.Responses;
using CQRS.Models;
using Core.Common.Exceptions;
using SkillService.Domain.Repositories;
using Microsoft.Extensions.Logging;

namespace SkillService.Application.CommandHandlers;

public class UpdateSkillCommandHandler(
    ISkillUnitOfWork unitOfWork,
    ILogger<UpdateSkillCommandHandler> logger)
    : BaseCommandHandler<UpdateSkillCommand, UpdateSkillResponse>(logger)
{
    private readonly ISkillUnitOfWork _unitOfWork = unitOfWork;

    public override async Task<ApiResponse<UpdateSkillResponse>> Handle(
        UpdateSkillCommand request,
        CancellationToken cancellationToken)
    {
        var skill = await _unitOfWork.Skills
            .GetByIdAndUserIdAsync(request.SkillId, request.UserId!, includeDeleted: false, cancellationToken);

        if (skill == null)
        {
            throw new ResourceNotFoundException("Skill", request.SkillId);
        }

        var changedFields = new Dictionary<string, string>();

        // ========================================
        // BASIC FIELDS
        // ========================================

        if (!string.IsNullOrEmpty(request.Name) && request.Name != skill.Name)
        {
            changedFields["Name"] = $"{skill.Name} -> {request.Name}";
            skill.Name = request.Name.Trim();
        }

        if (!string.IsNullOrEmpty(request.Description) && request.Description != skill.Description)
        {
            changedFields["Description"] = "Updated";
            skill.Description = request.Description.Trim();
        }

        if (request.IsOffered != skill.IsOffered)
        {
            changedFields["IsOffering"] = $"{skill.IsOffered} -> {request.IsOffered}";
            skill.IsOffered = request.IsOffered;
        }

        if (!string.IsNullOrEmpty(request.CategoryId) && request.CategoryId != skill.SkillTopicId)
        {
            // Validate new topic (CategoryId in command refers to TopicId in 3-layer hierarchy)
            var newTopic = await _unitOfWork.SkillTopics
                .GetByIdAsync(request.CategoryId, cancellationToken);

            if (newTopic == null || !newTopic.IsActive)
            {
                throw new ResourceNotFoundException("SkillTopic", request.CategoryId);
            }

            // Update topic reference
            var oldTopic = await _unitOfWork.SkillTopics
                .GetByIdAsync(skill.SkillTopicId, cancellationToken);

            changedFields["Category"] = $"{oldTopic?.Name} -> {newTopic.Name}";
            skill.SkillTopicId = request.CategoryId;
        }

        if (request.Tags != null)
        {
            changedFields["Tags"] = "Updated";
            skill.Tags = request.Tags;
        }

        if (request.AvailableHours.HasValue)
        {
            changedFields["Duration"] = $"{skill.EstimatedDurationMinutes} -> {request.AvailableHours}";
            skill.EstimatedDurationMinutes = request.AvailableHours;
        }

        if (request.IsActive.HasValue && request.IsActive.Value != skill.IsActive)
        {
            changedFields["Status"] = $"{(skill.IsActive ? "Active" : "Inactive")} -> {(request.IsActive.Value ? "Active" : "Inactive")}";
            skill.IsActive = request.IsActive.Value;
        }

        // ========================================
        // EXCHANGE OPTIONS
        // ========================================

        if (!string.IsNullOrEmpty(request.ExchangeType) && request.ExchangeType != skill.ExchangeType)
        {
            changedFields["ExchangeType"] = $"{skill.ExchangeType} -> {request.ExchangeType}";
            skill.ExchangeType = request.ExchangeType;
        }

        if (request.DesiredSkillCategoryId != null && request.DesiredSkillCategoryId != skill.DesiredSkillTopicId)
        {
            changedFields["DesiredSkillCategoryId"] = "Updated";
            skill.DesiredSkillTopicId = request.DesiredSkillCategoryId;
        }

        if (request.DesiredSkillDescription != null && request.DesiredSkillDescription != skill.DesiredSkillDescription)
        {
            changedFields["DesiredSkillDescription"] = "Updated";
            skill.DesiredSkillDescription = request.DesiredSkillDescription?.Trim();
        }

        if (request.HourlyRate.HasValue && request.HourlyRate != skill.HourlyRate)
        {
            changedFields["HourlyRate"] = $"{skill.HourlyRate} -> {request.HourlyRate}";
            skill.HourlyRate = request.HourlyRate;
        }

        if (!string.IsNullOrEmpty(request.Currency) && request.Currency != skill.Currency)
        {
            changedFields["Currency"] = $"{skill.Currency} -> {request.Currency}";
            skill.Currency = request.Currency;
        }

        // ========================================
        // SCHEDULING
        // ========================================

        if (request.PreferredDays != null)
        {
            changedFields["PreferredDays"] = "Updated";
            skill.PreferredDays = request.PreferredDays;
        }

        if (request.PreferredTimes != null)
        {
            changedFields["PreferredTimes"] = "Updated";
            skill.PreferredTimes = request.PreferredTimes;
        }

        if (request.SessionDurationMinutes.HasValue && request.SessionDurationMinutes != skill.SessionDurationMinutes)
        {
            changedFields["SessionDurationMinutes"] = $"{skill.SessionDurationMinutes} -> {request.SessionDurationMinutes}";
            skill.SessionDurationMinutes = request.SessionDurationMinutes.Value;
        }

        if (request.TotalSessions.HasValue && request.TotalSessions != skill.TotalSessions)
        {
            changedFields["TotalSessions"] = $"{skill.TotalSessions} -> {request.TotalSessions}";
            skill.TotalSessions = request.TotalSessions.Value;
        }

        // ========================================
        // LOCATION
        // ========================================

        if (!string.IsNullOrEmpty(request.LocationType) && request.LocationType != skill.LocationType)
        {
            changedFields["LocationType"] = $"{skill.LocationType} -> {request.LocationType}";
            skill.LocationType = request.LocationType;
        }

        if (request.LocationAddress != null && request.LocationAddress != skill.LocationAddress)
        {
            changedFields["LocationAddress"] = "Updated";
            skill.LocationAddress = request.LocationAddress?.Trim();
        }

        if (request.LocationCity != null && request.LocationCity != skill.LocationCity)
        {
            changedFields["LocationCity"] = $"{skill.LocationCity} -> {request.LocationCity}";
            skill.LocationCity = request.LocationCity?.Trim();
        }

        if (request.LocationPostalCode != null && request.LocationPostalCode != skill.LocationPostalCode)
        {
            changedFields["LocationPostalCode"] = "Updated";
            skill.LocationPostalCode = request.LocationPostalCode?.Trim();
        }

        if (request.LocationCountry != null && request.LocationCountry != skill.LocationCountry)
        {
            changedFields["LocationCountry"] = $"{skill.LocationCountry} -> {request.LocationCountry}";
            skill.LocationCountry = request.LocationCountry?.Trim()?.ToUpperInvariant();
        }

        if (request.MaxDistanceKm.HasValue && request.MaxDistanceKm != skill.MaxDistanceKm)
        {
            changedFields["MaxDistanceKm"] = $"{skill.MaxDistanceKm} -> {request.MaxDistanceKm}";
            skill.MaxDistanceKm = request.MaxDistanceKm.Value;
        }

        // ========================================
        // FINALIZE UPDATE
        // ========================================

        if (!changedFields.Any())
        {
            throw new Core.Common.Exceptions.InvalidOperationException(
                "UpdateSkill",
                "No changes provided",
                "At least one field must be updated");
        }

        // Update search keywords if name or description changed
        if (changedFields.ContainsKey("Name") || changedFields.ContainsKey("Description") || changedFields.ContainsKey("Tags"))
        {
            skill.SearchKeywords = GenerateSearchKeywords(skill.Name, skill.Description, skill.Tags);
        }

        skill.UpdatedAt = DateTime.UtcNow;
        skill.UpdatedBy = request.UserId;

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        Logger.LogInformation("Skill {SkillId} updated successfully by user {UserId} with changes: {Changes}",
            skill.Id, request.UserId, string.Join(", ", changedFields.Keys));

        var response = new UpdateSkillResponse(
            skill.Id,
            skill.Name,
            skill.Description,
            skill.SkillTopicId,
            skill.Tags,
            skill.IsOffered,
            skill.IsActive,
            skill.UpdatedAt.Value);

        return Success(response, "Skill updated successfully");
    }

    private static string GenerateSearchKeywords(string name, string description, List<string> tags)
    {
        var keywords = new List<string> { name };

        var descriptionWords = description.Split(' ', StringSplitOptions.RemoveEmptyEntries)
            .Where(w => w.Length > 3)
            .Take(10);
        keywords.AddRange(descriptionWords);
        keywords.AddRange(tags);

        return string.Join(" ", keywords.Distinct()).ToLowerInvariant();
    }
}
