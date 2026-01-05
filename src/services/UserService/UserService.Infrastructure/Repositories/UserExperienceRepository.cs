using Microsoft.EntityFrameworkCore;
using UserService.Domain.Models;
using UserService.Domain.Repositories;
using Core.Common.Exceptions;

namespace UserService.Infrastructure.Repositories;

public class UserExperienceRepository(UserDbContext dbContext) : IUserExperienceRepository
{
    private readonly UserDbContext _dbContext = dbContext;

    public async Task<List<UserExperience>> GetUserExperiences(string userId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.UserExperiences
            .Where(e => e.UserId == userId && !e.IsDeleted)
            .OrderBy(e => e.SortOrder)
            .ThenByDescending(e => e.StartDate)
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    public async Task<UserExperience?> GetExperienceById(string experienceId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.UserExperiences
            .Where(e => e.Id == experienceId && !e.IsDeleted)
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<UserExperience> AddExperience(UserExperience experience, CancellationToken cancellationToken = default)
    {
        _dbContext.UserExperiences.Add(experience);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return experience;
    }

    public async Task<UserExperience> UpdateExperience(UserExperience experience, CancellationToken cancellationToken = default)
    {
        _dbContext.UserExperiences.Update(experience);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return experience;
    }

    public async Task DeleteExperience(string experienceId, string userId, CancellationToken cancellationToken = default)
    {
        var experience = await _dbContext.UserExperiences
            .Where(e => e.Id == experienceId && e.UserId == userId && !e.IsDeleted)
            .FirstOrDefaultAsync(cancellationToken);

        if (experience == null)
            throw new ResourceNotFoundException("Experience", experienceId);

        experience.IsDeleted = true;
        experience.DeletedAt = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync(cancellationToken);
    }
}
