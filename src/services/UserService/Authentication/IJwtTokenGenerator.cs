using UserService.Models;

namespace UserService.Authentication;

public interface IJwtTokenGenerator
{
    Task<string> GenerateToken(User user);
}
