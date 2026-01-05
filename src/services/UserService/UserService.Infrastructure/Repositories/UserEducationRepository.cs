using Microsoft.EntityFrameworkCore;
using UserService.Domain.Models;
using UserService.Domain.Repositories;
using Core.Common.Exceptions;

namespace UserService.Infrastructure.Repositories;

public class UserEducationRepository(UserDbContext dbContext) : IUserEducationRepository
{
    private readonly UserDbContext _dbContext = dbContext;

    public async Task<List<UserEducation>> GetUserEducation(string userId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.UserEducation
            .Where(e => e.UserId == userId && !e.IsDeleted)
            .OrderBy(e => e.SortOrder)
            .ThenByDescending(e => e.GraduationYear)
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    public async Task<UserEducation?> GetEducationById(string educationId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.UserEducation
            .Where(e => e.Id == educationId && !e.IsDeleted)
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<UserEducation> AddEducation(UserEducation education, CancellationToken cancellationToken = default)
    {
        _dbContext.UserEducation.Add(education);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return education;
    }

    public async Task<UserEducation> UpdateEducation(UserEducation education, CancellationToken cancellationToken = default)
    {
        _dbContext.UserEducation.Update(education);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return education;
    }

    public async Task DeleteEducation(string educationId, string userId, CancellationToken cancellationToken = default)
    {
        var education = await _dbContext.UserEducation
            .Where(e => e.Id == educationId && e.UserId == userId && !e.IsDeleted)
            .FirstOrDefaultAsync(cancellationToken);

        if (education == null)
            throw new ResourceNotFoundException("Education", educationId);

        education.IsDeleted = true;
        education.DeletedAt = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync(cancellationToken);
    }
}
