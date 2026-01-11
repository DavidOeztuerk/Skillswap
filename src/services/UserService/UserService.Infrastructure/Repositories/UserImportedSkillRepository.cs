using Microsoft.EntityFrameworkCore;
using UserService.Domain.Models;
using UserService.Domain.Repositories;

namespace UserService.Infrastructure.Repositories;

/// <summary>
/// Repository implementation for user imported skills
/// </summary>
public class UserImportedSkillRepository(UserDbContext dbContext) : IUserImportedSkillRepository
{
  private readonly UserDbContext _dbContext = dbContext;

  public async Task<List<UserImportedSkill>> GetByUserIdAsync(string userId, CancellationToken cancellationToken = default)
  {
    return await _dbContext.UserImportedSkills
        .Where(s => s.UserId == userId && !s.IsDeleted)
        .OrderBy(s => s.SortOrder)
        .ThenBy(s => s.Name)
        .AsNoTracking()
        .ToListAsync(cancellationToken);
  }

  public async Task<List<UserImportedSkill>> GetVisibleByUserIdAsync(string userId, CancellationToken cancellationToken = default)
  {
    return await _dbContext.UserImportedSkills
        .Where(s => s.UserId == userId && s.IsVisible && !s.IsDeleted)
        .OrderBy(s => s.SortOrder)
        .ThenByDescending(s => s.EndorsementCount)
        .ThenBy(s => s.Name)
        .AsNoTracking()
        .ToListAsync(cancellationToken);
  }

  public async Task<UserImportedSkill?> GetByIdAsync(string id, CancellationToken cancellationToken = default)
  {
    return await _dbContext.UserImportedSkills
        .Where(s => s.Id == id && !s.IsDeleted)
        .FirstOrDefaultAsync(cancellationToken);
  }

  public async Task<UserImportedSkill?> GetByExternalIdAsync(string userId, string externalId, string source, CancellationToken cancellationToken = default)
  {
    return await _dbContext.UserImportedSkills
        .Where(s => s.UserId == userId && s.ExternalId == externalId && s.Source == source && !s.IsDeleted)
        .FirstOrDefaultAsync(cancellationToken);
  }

  public async Task<UserImportedSkill?> GetByNormalizedNameAsync(string userId, string normalizedName, CancellationToken cancellationToken = default)
  {
    return await _dbContext.UserImportedSkills
        .Where(s => s.UserId == userId && s.NormalizedName == normalizedName && !s.IsDeleted)
        .FirstOrDefaultAsync(cancellationToken);
  }

  public async Task<List<UserImportedSkill>> GetBySourceAsync(string userId, string source, CancellationToken cancellationToken = default)
  {
    return await _dbContext.UserImportedSkills
        .Where(s => s.UserId == userId && s.Source == source && !s.IsDeleted)
        .OrderBy(s => s.SortOrder)
        .ThenBy(s => s.Name)
        .AsNoTracking()
        .ToListAsync(cancellationToken);
  }

  public async Task<UserImportedSkill> CreateAsync(UserImportedSkill skill, CancellationToken cancellationToken = default)
  {
    _dbContext.UserImportedSkills.Add(skill);
    await _dbContext.SaveChangesAsync(cancellationToken);
    return skill;
  }

  public async Task<List<UserImportedSkill>> CreateManyAsync(List<UserImportedSkill> skills, CancellationToken cancellationToken = default)
  {
    _dbContext.UserImportedSkills.AddRange(skills);
    await _dbContext.SaveChangesAsync(cancellationToken);
    return skills;
  }

  public async Task<UserImportedSkill> UpdateAsync(UserImportedSkill skill, CancellationToken cancellationToken = default)
  {
    _dbContext.UserImportedSkills.Update(skill);
    await _dbContext.SaveChangesAsync(cancellationToken);
    return skill;
  }

  public async Task DeleteAsync(UserImportedSkill skill, CancellationToken cancellationToken = default)
  {
    skill.IsDeleted = true;
    skill.DeletedAt = DateTime.UtcNow;
    await _dbContext.SaveChangesAsync(cancellationToken);
  }

  public async Task DeleteBySourceAsync(string userId, string source, CancellationToken cancellationToken = default)
  {
    var skills = await _dbContext.UserImportedSkills
        .Where(s => s.UserId == userId && s.Source == source && !s.IsDeleted)
        .ToListAsync(cancellationToken);

    var now = DateTime.UtcNow;
    foreach (var skill in skills)
    {
      skill.IsDeleted = true;
      skill.DeletedAt = now;
    }

    await _dbContext.SaveChangesAsync(cancellationToken);
  }

  public async Task<bool> ExistsByNameAsync(string userId, string normalizedName, CancellationToken cancellationToken = default)
  {
    return await _dbContext.UserImportedSkills
        .AnyAsync(s => s.UserId == userId && s.NormalizedName == normalizedName && !s.IsDeleted, cancellationToken);
  }

  public async Task<int> GetCountBySourceAsync(string userId, string source, CancellationToken cancellationToken = default)
  {
    return await _dbContext.UserImportedSkills
        .CountAsync(s => s.UserId == userId && s.Source == source && !s.IsDeleted, cancellationToken);
  }

  public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
  {
    return await _dbContext.SaveChangesAsync(cancellationToken);
  }
}
