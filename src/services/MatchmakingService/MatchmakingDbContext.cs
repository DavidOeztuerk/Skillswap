using MatchmakingService.Models;
using Microsoft.EntityFrameworkCore;

namespace MatchmakingService;

public class MatchmakingDbContext(
    DbContextOptions<MatchmakingDbContext> options) 
    : DbContext(options)
{
    public DbSet<Match> Matches { get; set; }
}