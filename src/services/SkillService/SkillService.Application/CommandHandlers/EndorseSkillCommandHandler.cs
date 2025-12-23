using CQRS.Handlers;
using SkillService.Application.Commands;
using SkillService.Domain.Entities;
using SkillService.Domain.Repositories;
using Events.Domain.Skill;
using Contracts.Skill.Responses;
using CQRS.Models;
using Core.Common.Exceptions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace SkillService.Application.CommandHandlers;

public class EndorseSkillCommandHandler(
    ISkillUnitOfWork unitOfWork,
    ILogger<EndorseSkillCommandHandler> logger) 
    : BaseCommandHandler<EndorseSkillCommand, EndorseSkillResponse>(logger)
{
    private readonly ISkillUnitOfWork _unitOfWork = unitOfWork;

    public override async Task<ApiResponse<EndorseSkillResponse>> Handle(
        EndorseSkillCommand request,
        CancellationToken cancellationToken)
    {
        // Validate skill exists and belongs to the endorsed user
        var skill = await _unitOfWork.Skills.GetByIdAsync(request.SkillId, cancellationToken) ?? throw new ResourceNotFoundException("Skill", request.SkillId);

        // Check if user already endorsed this skill
        var existingEndorsement = await _unitOfWork.SkillEndorsements
                .GetBySkillAndUserAsync(request.SkillId, request.UserId!, includeDeleted: false, cancellationToken);

        if (existingEndorsement != null)
        {
            return Error("You have already endorsed this skill", ErrorCodes.BusinessRuleViolation);
        }

        // Create new endorsement
        var endorsement = new SkillEndorsement
        {
            SkillId = request.SkillId,
            EndorserUserId = request.UserId!,
            EndorsedUserId = request.EndorsedUserId,
            Message = request.Message?.Trim(),
            IsVisible = true,
            CreatedBy = request.UserId
        };

        await _unitOfWork.SkillEndorsements.CreateAsync(endorsement, cancellationToken);

        // Update skill endorsement count
        skill.IncrementEndorsements();

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        Logger.LogInformation("Skill {SkillId} endorsed by user {EndorserUserId}",
            request.SkillId, request.UserId);

        var response = new EndorseSkillResponse(
            endorsement.Id,
            skill.EndorsementCount);

        return Success(response, "Skill endorsed successfully");
    }
}