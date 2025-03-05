using Microsoft.EntityFrameworkCore;
using UserService.Models;

namespace UserService;

public class UserDbContext(
    DbContextOptions<UserDbContext> options)
    : DbContext(options)
{
    public DbSet<User> Users { get; set; }
}
