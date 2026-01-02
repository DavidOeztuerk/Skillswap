using CQRS.Handlers;
using SkillService.Application.Commands;
using SkillService.Domain.Entities;
using SkillService.Domain.Repositories;
using Contracts.Skill.Responses;
using CQRS.Models;
using Core.Common.Exceptions;
using Microsoft.Extensions.Logging;

namespace SkillService.Application.CommandHandlers;

public class AddFavoriteCommandHandler(
    ISkillUnitOfWork unitOfWork,
    ILogger<AddFavoriteCommandHandler> logger)
    : BaseCommandHandler<AddFavoriteCommand, AddFavoriteResponse>(logger)
{
    private readonly ISkillUnitOfWork _unitOfWork = unitOfWork;

    public override async Task<ApiResponse<AddFavoriteResponse>> Handle(
        AddFavoriteCommand request,
        CancellationToken cancellationToken)
    {
        // Validate skill exists
        var skill = await _unitOfWork.Skills.GetByIdAsync(request.SkillId, cancellationToken)
            ?? throw new ResourceNotFoundException("Skill", request.SkillId);

        // Check if already favorited
        var isFavorite = await _unitOfWork.SkillFavorites.IsFavoriteAsync(
            request.UserId!, request.SkillId, cancellationToken);

        if (isFavorite)
        {
            return Error("Skill is already in favorites", ErrorCodes.BusinessRuleViolation);
        }

        // Create favorite
        var favorite = SkillFavorite.Create(request.UserId!, request.SkillId);

        await _unitOfWork.SkillFavorites.AddAsync(favorite, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        Logger.LogInformation("User {UserId} added skill {SkillId} to favorites",
            request.UserId, request.SkillId);

        var response = new AddFavoriteResponse(
            favorite.Id,
            favorite.SkillId,
            favorite.CreatedAt);

        return Success(response, "Skill added to favorites");
    }
}
