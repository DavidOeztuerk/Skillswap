using System.Security.Claims;
using UserService.Domain.Models;

namespace UserService.Authentication;

public interface IJwtTokenGenerator
{
    Task<string> GenerateToken(User user);
    Task<string> GenerateRefreshToken();
    Task<ClaimsPrincipal>? GetPrincipalFromExpiredToken(string token);
}
