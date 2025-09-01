using Microsoft.EntityFrameworkCore;
using UserService.Domain.Enums;
using UserService.Domain.Models;
using UserService.Domain.Repositories;

namespace UserService.Infrastructure.Repositories;

public class UserRepository(UserDbContext userDbContext) : IUserRepository
{
    private readonly UserDbContext _dbContext = userDbContext;

    // ---------- Users ----------
    public IQueryable<User> GetUsers(CancellationToken cancellationToken = default)
    {
        try
        {
            return _dbContext.Users
                .AsNoTracking() // Performance: Read-only query
                .Include(u => u.UserRoles.Where(ur => ur.RevokedAt == null && !ur.IsDeleted))
                    .ThenInclude(ur => ur.Role)
                .AsSplitQuery() // Performance: Vermeidet Cartesian Product bei Multiple Includes
                .AsQueryable();
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException("Failed to get users", ex);
        }
    }

    public async Task<User?> GetUserById(string userId, CancellationToken cancellationToken = default)
    {
        try
        {
            return await _dbContext.Users
                .Include(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)
                .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException($"Failed to get user by ID {userId}", ex);
        }
    }

    public async Task<User?> GetUserByEmail(string email, CancellationToken cancellationToken = default)
    {
        try
        {
            return await _dbContext.Users
                .FirstOrDefaultAsync(u => u.Email == email, cancellationToken);
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException($"Failed to get user by email {email}", ex);
        }
    }

    public async Task<User?> GetUserByEmailWithRoles(string email, CancellationToken cancellationToken = default)
    {
        try
        {
            return await _dbContext.Users
                .Include(u => u.UserRoles.Where(ur => ur.RevokedAt == null))
                    .ThenInclude(ur => ur.Role)
                .FirstOrDefaultAsync(u => u.Email == email, cancellationToken);
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException($"Failed to get user by email with roles {email}", ex);
        }
    }

    public async Task<User?> GetUserWithRoles(string userId, CancellationToken cancellationToken = default)
    {
        try
        {
            return await _dbContext.Users
                .Include(u => u.UserRoles.Where(ur => ur.RevokedAt == null))
                    .ThenInclude(ur => ur.Role)
                .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException($"Failed to get user with roles {userId}", ex);
        }
    }

    public async Task<User> AddUser(User user, CancellationToken cancellationToken = default)
    {
        try
        {
            _dbContext.Users.Add(user);
            await _dbContext.SaveChangesAsync(cancellationToken);
            return user;
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException("Failed to add user", ex);
        }
    }

    public async Task<User> UpdateUser(User user, CancellationToken cancellationToken = default)
    {
        try
        {
            _dbContext.Users.Update(user);
            await _dbContext.SaveChangesAsync(cancellationToken);
            return user;
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException($"Failed to update user {user.Id}", ex);
        }
    }

    // ---------- Email checks ----------
    public async Task<bool> IsEmailTaken(string email, CancellationToken cancellationToken = default)
    {
        try
        {
            return await _dbContext.Users.AnyAsync(u => u.Email == email, cancellationToken);
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException($"Failed to check if email {email} is taken", ex);
        }
    }

    // ---------- UserRoles ----------
    public async Task<UserRole> AddUserRole(UserRole userRole, CancellationToken cancellationToken = default)
    {
        try
        {
            _dbContext.UserRoles.Add(userRole);
            await _dbContext.SaveChangesAsync(cancellationToken);
            return userRole;
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException($"Failed to add user role {userRole.RoleId} for user {userRole.UserId}", ex);
        }
    }

    public async Task<List<UserRole>> GetActiveUserRoles(string userId, CancellationToken cancellationToken = default)
    {
        try
        {
            return await _dbContext.UserRoles
                .Include(ur => ur.Role)
                .Where(ur => ur.UserId == userId && ur.RevokedAt == null)
                .AsNoTracking()
                .ToListAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException($"Failed to get active user roles for user {userId}", ex);
        }
    }

    public async Task<bool> HasRole(string userId, string roleName, CancellationToken cancellationToken = default)
    {
        try
        {
            return await _dbContext.UserRoles
                .Include(ur => ur.Role)
                .AnyAsync(ur => ur.UserId == userId
                                && ur.RevokedAt == null
                                && ur.Role.Name == roleName, cancellationToken);
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException($"Failed to check if user {userId} has role {roleName}", ex);
        }
    }

    public async Task<bool> IsAnyAdminExists(CancellationToken cancellationToken = default)
    {
        try
        {
            return await _dbContext.UserRoles
                .Include(ur => ur.Role)
                .AnyAsync(ur => ur.RevokedAt == null && ur.Role.Name == "Admin", cancellationToken);
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException("Failed to check if any admin exists", ex);
        }
    }

    public async Task AssignUserRole(string userId, string roleName, string assignedBy, CancellationToken cancellationToken = default)
    {
        try
        {
            var roleId = await _dbContext.Roles
                .Where(r => r.Name == roleName && r.IsActive)
                .Select(r => r.Id)
                .FirstOrDefaultAsync(cancellationToken);

            if (roleId is null)
                throw new InvalidOperationException($"Role not found: {roleName}");

            var exists = await _dbContext.UserRoles
                .AnyAsync(ur => ur.UserId == userId && ur.RoleId == roleId && ur.RevokedAt == null, cancellationToken);

            if (exists)
                throw new InvalidOperationException($"User {userId} already has role {roleName}");

            var userRole = new UserRole
            {
                UserId = userId,
                RoleId = roleId,
                AssignedBy = assignedBy,
                AssignedAt = DateTime.UtcNow
            };

            await AddUserRole(userRole, cancellationToken);
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException($"Failed to assign role {roleName} to user {userId}", ex);
        }
    }

    // ---------- Admin / Stats ----------
    public async Task<(List<User> users, int totalCount)> GetAllUsersPagedAsync(
        int pageNumber, int pageSize, CancellationToken cancellationToken = default)
    {
        try
        {
            var query = _dbContext.Users
                .Include(u => u.UserRoles.Where(ur => ur.RevokedAt == null))
                    .ThenInclude(ur => ur.Role)
                .Where(u => !u.IsDeleted);

            var totalCount = await query.CountAsync(cancellationToken);

            var users = await query
                .OrderBy(u => u.CreatedAt)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .AsNoTracking()
                .ToListAsync(cancellationToken);

            return (users, totalCount);
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException("Failed to get all users paged", ex);
        }
    }

    public async Task<Dictionary<string, int>> GetUsersCountByStatus(CancellationToken cancellationToken = default)
    {
        try
        {
            return await _dbContext.Users
                .Where(u => !u.IsDeleted)
                .GroupBy(u => u.AccountStatus)
                .Select(g => new { Key = g.Key.ToString(), Cnt = g.Count() })
                .ToDictionaryAsync(x => x.Key, x => x.Cnt, cancellationToken);
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException("Failed to get users count by status", ex);
        }
    }

    public async Task<Dictionary<string, int>> GetUsersCountByRole(CancellationToken cancellationToken = default)
    {
        try
        {
            return await _dbContext.UserRoles
                .Include(ur => ur.Role)
                .Where(ur => ur.RevokedAt == null)
                .GroupBy(ur => ur.Role.Name)
                .Select(g => new { Key = g.Key, Cnt = g.Count() })
                .ToDictionaryAsync(x => x.Key, x => x.Cnt, cancellationToken);
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException("Failed to get users count by role", ex);
        }
    }

    // ---------- Search ----------
    public async Task<(List<User> users, int totalCount)> SearchUsers(
        string? searchTerm, string? roleName, string? accountStatus, bool? emailVerified,
        DateTime? createdAfter, DateTime? createdBefore, int pageNumber, int pageSize,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var query = _dbContext.Users
                .Include(u => u.UserRoles.Where(ur => ur.RevokedAt == null))
                    .ThenInclude(ur => ur.Role)
                .Where(u => !u.IsDeleted);

            if (!string.IsNullOrWhiteSpace(searchTerm))
            {
                query = query.Where(u =>
                    EF.Functions.ILike(u.FirstName, $"%{searchTerm}%") ||
                    EF.Functions.ILike(u.LastName, $"%{searchTerm}%") ||
                    EF.Functions.ILike(u.Email, $"%{searchTerm}%") ||
                    EF.Functions.ILike(u.UserName, $"%{searchTerm}%"));
            }

            if (!string.IsNullOrWhiteSpace(roleName))
            {
                query = query.Where(u => u.UserRoles.Any(ur => ur.RevokedAt == null && ur.Role.Name == roleName));
            }

            if (!string.IsNullOrWhiteSpace(accountStatus) && Enum.TryParse(accountStatus, out AccountStatus status))
            {
                query = query.Where(u => u.AccountStatus == status);
            }

            if (emailVerified.HasValue)
                query = query.Where(u => u.EmailVerified == emailVerified.Value);

            if (createdAfter.HasValue)
                query = query.Where(u => u.CreatedAt >= createdAfter.Value);

            if (createdBefore.HasValue)
                query = query.Where(u => u.CreatedAt <= createdBefore.Value);

            var totalCount = await query.CountAsync(cancellationToken);

            var users = await query
                .OrderBy(u => u.CreatedAt)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .AsNoTracking()
                .ToListAsync(cancellationToken);

            return (users, totalCount);
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException("Failed to search users", ex);
        }
    }
}
