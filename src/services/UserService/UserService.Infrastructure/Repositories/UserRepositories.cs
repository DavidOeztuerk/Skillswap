using Microsoft.EntityFrameworkCore;
using UserService.Domain.Models;
using UserService.Domain.Repositories;
using UserService.Domain.Enums;

namespace UserService.Infrastructure.Repositories;

public class UserRepository(
    UserDbContext userDbContext)
    : IUserRepository
{
    private readonly UserDbContext _dbContext = userDbContext;

    // User CRUD Operations
    public IQueryable<User> GetUsers(CancellationToken cancellationToken = default)
    {
        try
        {
            return _dbContext.Users
                    .Include(u => u.UserRoles
                    .Where(ur => ur.IsActive && !ur.IsDeleted))
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
                .Include(u => u.UserRoles.Where(ur => ur.IsActive))
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
                .Include(u => u.UserRoles.Where(ur => ur.IsActive))
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

    // Email Availability & Validation
    public async Task<bool> IsEmailTaken(string email, CancellationToken cancellationToken = default)
    {
        try
        {
            return await _dbContext.Users
                .AnyAsync(u => u.Email == email, cancellationToken);
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException($"Failed to check if email {email} is taken", ex);
        }
    }


    // User Roles Management
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
            throw new InvalidOperationException($"Failed to add user role {userRole.Role} for user {userRole.UserId}", ex);
        }
    }

    public async Task<List<UserRole>> GetActiveUserRoles(string userId, CancellationToken cancellationToken = default)
    {
        try
        {
            return await _dbContext.UserRoles
                .Where(ur => ur.UserId == userId && ur.IsActive)
                .ToListAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException($"Failed to get active user roles for user {userId}", ex);
        }
    }

    public async Task<bool> HasRole(string userId, string role, CancellationToken cancellationToken = default)
    {
        try
        {
            return await _dbContext.UserRoles
                .AnyAsync(ur => ur.UserId == userId && ur.Role == role && ur.IsActive, cancellationToken);
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException($"Failed to check if user {userId} has role {role}", ex);
        }
    }

    public async Task<bool> IsAnyAdminExists(CancellationToken cancellationToken = default)
    {
        try
        {
            return await _dbContext.UserRoles
                .AnyAsync(ur => ur.Role == "Admin" && ur.IsActive, cancellationToken);
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException("Failed to check if any admin exists", ex);
        }
    }

    public async Task AssignUserRole(string userId, string role, string assignedBy, CancellationToken cancellationToken = default)
    {
        try
        {
            // Check if user already has this role
            var existingRole = await _dbContext.UserRoles
                .FirstOrDefaultAsync(ur => ur.UserId == userId && ur.Role == role && ur.IsActive, cancellationToken);

            if (existingRole != null)
            {
                throw new InvalidOperationException($"User {userId} already has role {role}");
            }

            var userRole = new UserRole
            {
                UserId = userId,
                Role = role,
                AssignedBy = assignedBy,
                AssignedAt = DateTime.UtcNow
            };

            await AddUserRole(userRole, cancellationToken);
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException($"Failed to assign role {role} to user {userId}", ex);
        }
    }




    // Admin & Statistics Queries
    public async Task<(List<User> users, int totalCount)> GetAllUsersPagedAsync(
        int pageNumber, int pageSize, CancellationToken cancellationToken = default)
    {
        try
        {
            var query = _dbContext.Users
                .Include(u => u.UserRoles.Where(ur => ur.IsActive))
                .Where(u => !u.IsDeleted);

            var totalCount = await query.CountAsync(cancellationToken);

            var users = await query
                .OrderBy(u => u.CreatedAt)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
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
                .ToDictionaryAsync(g => g.Key.ToString(), g => g.Count(), cancellationToken);
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
                .Where(ur => ur.IsActive)
                .GroupBy(ur => ur.Role)
                .ToDictionaryAsync(g => g.Key, g => g.Count(), cancellationToken);
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException("Failed to get users count by role", ex);
        }
    }

    // Search & Filtering
    public async Task<(List<User> users, int totalCount)> SearchUsers(
        string? searchTerm, string? role, string? accountStatus, bool? emailVerified,
        DateTime? createdAfter, DateTime? createdBefore, int pageNumber, int pageSize,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var query = _dbContext.Users
                .Include(u => u.UserRoles.Where(ur => ur.IsActive))
                .Where(u => !u.IsDeleted);

            if (!string.IsNullOrEmpty(searchTerm))
            {
                query = query.Where(u => u.FirstName.Contains(searchTerm) ||
                                       u.LastName.Contains(searchTerm) ||
                                       u.Email.Contains(searchTerm) ||
                                       u.UserName.Contains(searchTerm));
            }

            if (!string.IsNullOrEmpty(role))
            {
                query = query.Where(u => u.UserRoles.Any(ur => ur.Role == role && ur.IsActive));
            }

            if (!string.IsNullOrEmpty(accountStatus) && Enum.TryParse<AccountStatus>(accountStatus, out var status))
            {
                query = query.Where(u => u.AccountStatus == status);
            }

            if (emailVerified.HasValue)
            {
                query = query.Where(u => u.EmailVerified == emailVerified.Value);
            }

            if (createdAfter.HasValue)
            {
                query = query.Where(u => u.CreatedAt >= createdAfter.Value);
            }

            if (createdBefore.HasValue)
            {
                query = query.Where(u => u.CreatedAt <= createdBefore.Value);
            }

            var totalCount = await query.CountAsync(cancellationToken);

            var users = await query
                .OrderBy(u => u.CreatedAt)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync(cancellationToken);

            return (users, totalCount);
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException("Failed to search users", ex);
        }
    }

}
