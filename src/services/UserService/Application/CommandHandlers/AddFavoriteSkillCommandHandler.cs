using CQRS.Handlers;
using Infrastructure.Models;
using UserService.Application.Commands.Favorites;

namespace UserService.Application.CommandHandlers.Favorites;

public class AddFavoriteSkillCommandHandler(
    UserDbContext dbContext,
    ILogger<AddFavoriteSkillCommandHandler> logger) 
    : BaseCommandHandler<AddFavoriteSkillCommand, bool>(logger)
{
    private readonly UserDbContext _dbContext = dbContext;

    public override async Task<ApiResponse<bool>> Handle(AddFavoriteSkillCommand request, CancellationToken cancellationToken)
    {
        var user = await _dbContext.Users.FindAsync([request.UserId], cancellationToken);
        if (user == null) return Error("User not found");
        if (!user.FavoriteSkillIds.Contains(request.SkillId))
        {
            user.FavoriteSkillIds.Add(request.SkillId);
            await _dbContext.SaveChangesAsync(cancellationToken);
        }
        return Success(true, "Succesfully added skill to your favourite");
    }
}
