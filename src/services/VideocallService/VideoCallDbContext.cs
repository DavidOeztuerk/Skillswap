using Microsoft.EntityFrameworkCore;
using VideocallService.Models;

namespace VideocallService;

public class VideoCallDbContext(
    DbContextOptions<VideoCallDbContext> options)
    : DbContext(options)
{
    public DbSet<VideoCallSession> VideoCalls { get; set; }
}
