using CQRS.Handlers;
using CQRS.Models;
using Microsoft.Extensions.Logging;
using UserService.Application.Queries;
using UserService.Domain.Repositories;

namespace UserService.Application.QueryHandlers;

public class GetFavoriteSkillsQueryHandler(
    IUserSkillsRepository userSkillsRepository,
    ILogger<GetFavoriteSkillsQueryHandler> logger)
    : BasePagedQueryHandler<GetFavoriteSkillsQuery, string>(logger)
{
    private readonly IUserSkillsRepository _userSkillsRepository = userSkillsRepository;

    public override async Task<PagedResponse<string>> Handle(
        GetFavoriteSkillsQuery request,
        CancellationToken cancellationToken)
    {
        var favoriteSkills = await _userSkillsRepository.GetFavoriteSkills(
            request.UserId,
            cancellationToken);

        return Success(favoriteSkills, request.PageNumber, request.PageSize, favoriteSkills.Count);
    }
}
