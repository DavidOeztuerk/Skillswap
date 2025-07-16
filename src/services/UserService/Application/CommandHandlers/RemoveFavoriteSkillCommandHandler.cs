using CQRS.Handlers;
using Infrastructure.Models;
using UserService.Application.Commands.Favorites;

namespace UserService.Application.CommandHandlers.Favorites;

public class RemoveFavoriteSkillCommandHandler(
    UserDbContext dbContext,
    ILogger<RemoveFavoriteSkillCommandHandler> logger) 
    : BaseCommandHandler<RemoveFavoriteSkillCommand, bool>(logger)
{
    private readonly UserDbContext _dbContext = dbContext;

    public override async Task<ApiResponse<bool>> Handle(RemoveFavoriteSkillCommand request, CancellationToken cancellationToken)
    {
        var user = await _dbContext.Users.FindAsync([request.UserId], cancellationToken);
        if (user == null) return Error("No User was found");
        if (user.FavoriteSkillIds.Contains(request.SkillId))
        {
            user.FavoriteSkillIds.Remove(request.SkillId);
            await _dbContext.SaveChangesAsync(cancellationToken);
        }
        return Success(true, "Favourite succesfuly removed");
    }
}    
