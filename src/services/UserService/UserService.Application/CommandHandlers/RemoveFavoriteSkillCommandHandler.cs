using CQRS.Handlers;
using CQRS.Models;
using Infrastructure.Models;
using Microsoft.Extensions.Logging;
using UserService.Application.Commands.Favorites;
using UserService.Domain.Repositories;

namespace UserService.Application.CommandHandlers.Favorites;

public class RemoveFavoriteSkillCommandHandler(
    IUserSkillsRepository userSkillsRepository,
    ILogger<RemoveFavoriteSkillCommandHandler> logger)
    : BaseCommandHandler<RemoveFavoriteSkillCommand, bool>(logger)
{
    private readonly IUserSkillsRepository _userSkillsRepository = userSkillsRepository;

    public override async Task<ApiResponse<bool>> Handle(RemoveFavoriteSkillCommand request, CancellationToken cancellationToken)
    {
        if (request.UserId is null) return Error("UserId is required");

        var success = await _userSkillsRepository.RemoveFavoriteSkill(request.UserId, request.SkillId, cancellationToken);
        return success
            ? Success(true, "Favourite successfully removed")
            : Error("Failed to remove favourite skill");
    }
}
