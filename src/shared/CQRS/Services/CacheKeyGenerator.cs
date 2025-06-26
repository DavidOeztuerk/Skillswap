namespace CQRS.Services;

/// <summary>
/// Cache key generator for consistent key generation
/// </summary>
public static class CacheKeyGenerator
{
    public static string GenerateKey(string prefix, params object[] parameters)
    {
        var validParams = parameters.Where(p => p != null).Select(p => p.ToString());
        return $"{prefix}:{string.Join(":", validParams)}";
    }

    public static class Skills
    {
        public static string Search(string? query, string? categoryId, int page, int pageSize)
            => GenerateKey("skills-search", query ?? "all", categoryId ?? "all", page, pageSize);

        public static string Details(string skillId, bool includeReviews, bool includeEndorsements)
            => GenerateKey("skill-details", skillId, includeReviews, includeEndorsements);

        public static string UserSkills(string userId, bool? isOffering, string? categoryId, int page, int pageSize)
            => GenerateKey("user-skills", userId, isOffering?.ToString() ?? "all", categoryId ?? "all", page, pageSize);

        public static string Categories(bool includeInactive, bool includeSkillCounts)
            => GenerateKey("skill-categories", includeInactive, includeSkillCounts);

        public static string Statistics(DateTime? fromDate, DateTime? toDate, string? categoryId, string? userId)
            => GenerateKey("skill-statistics", fromDate?.ToString("yyyy-MM-dd") ?? "all",
                          toDate?.ToString("yyyy-MM-dd") ?? "all", categoryId ?? "all", userId ?? "all");
    }

    public static class Users
    {
        public static string Profile(string userId)
            => GenerateKey("user-profile", userId);

        public static string Roles(string userId)
            => GenerateKey("user-roles", userId);

        public static string EmailAvailability(string email)
            => GenerateKey("email-availability", email);
    }
}