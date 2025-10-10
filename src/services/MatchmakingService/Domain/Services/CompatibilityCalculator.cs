namespace MatchmakingService.Domain.Services;

/// <summary>
/// Calculates compatibility score between users based on skills, availability, and preferences
/// Score ranges from 0.0 to 1.0
/// </summary>
public static class CompatibilityCalculator
{
    /// <summary>
    /// Calculate compatibility between a match request and potential match
    /// </summary>
    public static double CalculateScore(
        bool skillsMatch,
        double requesterRating,
        double targetUserRating,
        List<string> requesterPreferredDays,
        List<string> targetUserPreferredDays,
        List<string> requesterPreferredTimes,
        List<string> targetUserPreferredTimes,
        bool isSkillExchange,
        bool exchangeSkillsMatch = false)
    {
        double score = 0.0;

        // 1. Base Score: Skills Match (40%)
        if (skillsMatch)
        {
            score += 0.40;
        }

        // 2. User Ratings Quality (20%)
        var avgRating = (requesterRating + targetUserRating) / 2.0;
        var ratingScore = (avgRating / 5.0) * 0.20;
        score += ratingScore;

        // 3. Schedule Overlap (30%)
        var dayOverlap = CalculateOverlapPercentage(requesterPreferredDays, targetUserPreferredDays);
        var timeOverlap = CalculateOverlapPercentage(requesterPreferredTimes, targetUserPreferredTimes);
        var scheduleScore = ((dayOverlap + timeOverlap) / 2.0) * 0.30;
        score += scheduleScore;

        // 4. Exchange Bonus (10%)
        if (isSkillExchange && exchangeSkillsMatch)
        {
            score += 0.10;
        }

        // Ensure score is between 0 and 1
        return Math.Max(0.0, Math.Min(1.0, score));
    }

    private static double CalculateOverlapPercentage(List<string> list1, List<string> list2)
    {
        if (list1 == null || list2 == null || !list1.Any() || !list2.Any())
        {
            return 0.5; // Neutral score if no preferences specified
        }

        var intersection = list1.Intersect(list2, StringComparer.OrdinalIgnoreCase).Count();
        var union = list1.Union(list2, StringComparer.OrdinalIgnoreCase).Count();

        return union > 0 ? (double)intersection / union : 0.0;
    }
}
