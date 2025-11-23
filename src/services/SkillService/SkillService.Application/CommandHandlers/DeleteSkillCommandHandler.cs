using CQRS.Handlers;
using SkillService.Application.Commands;
using Contracts.Skill.Responses;
using CQRS.Models;
using Core.Common.Exceptions;
using SkillService.Domain.Repositories;
using Microsoft.Extensions.Logging;

namespace SkillService.Application.CommandHandlers;

public class DeleteSkillCommandHandler(
    ISkillUnitOfWork unitOfWork,
    ILogger<DeleteSkillCommandHandler> logger)
    : BaseCommandHandler<DeleteSkillCommand, DeleteSkillResponse>(logger)
{
    private readonly ISkillUnitOfWork _unitOfWork = unitOfWork;

    public override async Task<ApiResponse<DeleteSkillResponse>> Handle(
        DeleteSkillCommand request,
        CancellationToken cancellationToken)
    {
        var skill = await _unitOfWork.Skills.GetByIdAsync(request.SkillId, cancellationToken) ?? throw new ResourceNotFoundException("Skill", request.SkillId);

        // Check for active matches
        if (skill.Matches.Count != 0)
        {
            throw new Core.Common.Exceptions.InvalidOperationException(
                "DeleteSkill", 
                "HasActiveMatches", 
                "Cannot delete skill with active matches. Please complete or cancel existing matches first.");
        }

        // Soft delete
        skill.IsDeleted = true;
        skill.DeletedAt = DateTime.UtcNow;
        skill.DeletedBy = request.UserId;
        skill.IsActive = false;

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        Logger.LogInformation("Skill {SkillId} ({SkillName}) deleted by user {UserId}. Reason: {Reason}",
            skill.Id, skill.Name, request.UserId, request.Reason ?? "Not specified");

        var response = new DeleteSkillResponse(
            skill.Id,
            true,
            DateTime.UtcNow);

        return Success(response, "Skill deleted successfully");
    }
}
