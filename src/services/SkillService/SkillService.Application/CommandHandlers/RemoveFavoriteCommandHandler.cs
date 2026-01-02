using CQRS.Handlers;
using SkillService.Application.Commands;
using SkillService.Domain.Repositories;
using Contracts.Skill.Responses;
using CQRS.Models;
using Core.Common.Exceptions;
using Microsoft.Extensions.Logging;

namespace SkillService.Application.CommandHandlers;

public class RemoveFavoriteCommandHandler(
    ISkillUnitOfWork unitOfWork,
    ILogger<RemoveFavoriteCommandHandler> logger)
    : BaseCommandHandler<RemoveFavoriteCommand, RemoveFavoriteResponse>(logger)
{
    private readonly ISkillUnitOfWork _unitOfWork = unitOfWork;

    public override async Task<ApiResponse<RemoveFavoriteResponse>> Handle(
        RemoveFavoriteCommand request,
        CancellationToken cancellationToken)
    {
        // Check if favorited
        var isFavorite = await _unitOfWork.SkillFavorites.IsFavoriteAsync(
            request.UserId!, request.SkillId, cancellationToken);

        if (!isFavorite)
        {
            return Error("Skill is not in favorites", ErrorCodes.ResourceNotFound);
        }

        // Remove favorite
        await _unitOfWork.SkillFavorites.RemoveAsync(request.UserId!, request.SkillId, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        Logger.LogInformation("User {UserId} removed skill {SkillId} from favorites",
            request.UserId, request.SkillId);

        var response = new RemoveFavoriteResponse(request.SkillId, true);

        return Success(response, "Skill removed from favorites");
    }
}
