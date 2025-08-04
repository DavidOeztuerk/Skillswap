using CQRS.Handlers;
using CQRS.Models;
using Microsoft.Extensions.Logging;
using UserService.Application.Commands;
using UserService.Domain.Repositories;

namespace UserService.Application.CommandHandlers;

public class AddFavoriteSkillCommandHandler(
    IUserSkillsRepository userSkillsRepository,
    ILogger<AddFavoriteSkillCommandHandler> logger)
    : BaseCommandHandler<AddFavoriteSkillCommand, bool>(logger)
{
    private readonly IUserSkillsRepository userSkillsRepository = userSkillsRepository;

    public override async Task<ApiResponse<bool>> Handle(AddFavoriteSkillCommand request, CancellationToken cancellationToken)
    {
        if (request.UserId is null) return Error("UserId is required");

        var addedFavoriteSkill = await userSkillsRepository.AddFavoriteSkill(request.UserId, request.SkillId, cancellationToken);

        return Success(
            addedFavoriteSkill,
            addedFavoriteSkill ?
                "Succesfully added skill to your favourite" :
                "Failed added skill to your favorie");
    }
}
