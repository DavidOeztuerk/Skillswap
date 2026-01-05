using CQRS.Handlers;
using SkillService.Application.Queries;
using CQRS.Models;
using Contracts.Skill.Responses;
using SkillService.Domain.Repositories;
using Microsoft.Extensions.Logging;

namespace SkillService.Application.QueryHandlers;

public class IsFavoriteQueryHandler(
    ISkillUnitOfWork unitOfWork,
    ILogger<IsFavoriteQueryHandler> logger)
    : BaseQueryHandler<IsFavoriteQuery, IsFavoriteResponse>(logger)
{
    private readonly ISkillUnitOfWork _unitOfWork = unitOfWork;

    public override async Task<ApiResponse<IsFavoriteResponse>> Handle(
        IsFavoriteQuery request,
        CancellationToken cancellationToken)
    {
        var isFavorite = await _unitOfWork.SkillFavorites.IsFavoriteAsync(
            request.UserId, request.SkillId, cancellationToken);

        var response = new IsFavoriteResponse(request.SkillId, isFavorite);

        return Success(response);
    }
}
