using Microsoft.EntityFrameworkCore;
using UserService.Domain.Models;
using UserService.Domain.Repositories;

namespace UserService.Infrastructure.Repositories;

public class UserSkillsRepository(
    UserDbContext userDbContext) : IUserSkillsRepository
{
    private readonly UserDbContext _dbContext = userDbContext;

    public async Task<bool> AddFavoriteSkill(string userId, string skillId, CancellationToken cancellationToken = default)
    {
        try
        {
            var user = await _dbContext.Users.FindAsync([userId], cancellationToken);
            if (user == null)
            {
                throw new InvalidOperationException($"User with ID {userId} not found");
            }

            // Check if skill is already in favorites
            if (user.FavoriteSkillIds.Contains(skillId))
            {
                return false; // Skill already in favorites
            }

            user.FavoriteSkillIds.Add(skillId);
            user.UpdatedAt = DateTime.UtcNow;

            await _dbContext.SaveChangesAsync(cancellationToken);
            return true;
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException($"Failed to add favorite skill {skillId} for user {userId}", ex);
        }
    }

    public async Task<bool> RemoveFavoriteSkill(string userId, string skillId, CancellationToken cancellationToken = default)
    {
        try
        {
            var user = await _dbContext.Users.FindAsync([userId], cancellationToken);
            if (user == null)
            {
                throw new InvalidOperationException($"User with ID {userId} not found");
            }

            // Check if skill is in favorites
            if (!user.FavoriteSkillIds.Contains(skillId))
            {
                return false; // Skill not in favorites
            }

            user.FavoriteSkillIds.Remove(skillId);
            user.UpdatedAt = DateTime.UtcNow;

            await _dbContext.SaveChangesAsync(cancellationToken);
            return true;
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException($"Failed to remove favorite skill {skillId} for user {userId}", ex);
        }
    }

    public async Task<List<string>> GetFavoriteSkills(string userId, CancellationToken cancellationToken = default)
    {
        try
        {
            var user = await _dbContext.Users
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.Id == userId && !u.IsDeleted, cancellationToken);

            return user?.FavoriteSkillIds ?? new List<string>();
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException($"Failed to get favorite skills for user {userId}", ex);
        }
    }
}