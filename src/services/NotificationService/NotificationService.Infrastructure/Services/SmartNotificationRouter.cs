using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using NotificationService.Domain.Entities;
using NotificationService.Domain.Enums;
using NotificationService.Domain.Models;
using NotificationService.Domain.Services;
using NotificationService.Infrastructure.Data;
using Infrastructure.Communication;
using Contracts.User.Responses;

namespace NotificationService.Infrastructure.Services;

/// <summary>
/// Intelligent notification routing service that determines optimal delivery channels and timing
/// </summary>
public class SmartNotificationRouter : ISmartNotificationRouter
{
    private readonly NotificationDbContext _dbContext;
    private readonly ILogger<SmartNotificationRouter> _logger;
    private readonly IServiceCommunicationManager _serviceCommunication;

    // Routing rules configuration
    private readonly Dictionary<string, NotificationPriority> _templatePriorityMap = new()
    {
        // Critical - Always send immediately, override quiet hours
        ["email-verification"] = NotificationPriority.Critical,
        ["password-reset"] = NotificationPriority.Critical,
        ["security-alert"] = NotificationPriority.Critical,
        ["two-factor-code"] = NotificationPriority.Critical,

        // High - Send quickly but respect quiet hours
        ["appointment-confirmation"] = NotificationPriority.High,
        ["appointment-rescheduled"] = NotificationPriority.High,
        ["payment-received"] = NotificationPriority.High,

        // Normal - Standard delivery
        ["appointment-reminder"] = NotificationPriority.Normal,
        ["skill-match-found"] = NotificationPriority.Normal,
        ["message-received"] = NotificationPriority.Normal,

        // Low - Can be batched/delayed
        ["welcome"] = NotificationPriority.Low,
        ["newsletter"] = NotificationPriority.Low,
        ["tips-and-tricks"] = NotificationPriority.Low,
        ["survey-request"] = NotificationPriority.Low
    };

    public SmartNotificationRouter(
        NotificationDbContext dbContext,
        ILogger<SmartNotificationRouter> logger,
        IServiceCommunicationManager serviceCommunication)
    {
        _dbContext = dbContext;
        _logger = logger;
        _serviceCommunication = serviceCommunication;
    }

    public async Task<NotificationRoutingDecision> RouteNotificationAsync(NotificationRoutingRequest request)
    {
        try
        {
            _logger.LogInformation("Routing notification for user {UserId}, type {Type}, priority {Priority}",
                request.UserId, request.NotificationType, request.Priority);

            // 1. Get user preferences and channel availability
            var preferences = await GetUserPreferencesAsync(request.UserId);
            var availableChannels = await GetAvailableChannelsAsync(request.UserId);

            // 2. Determine effective priority
            var effectivePriority = DetermineEffectivePriority(request);

            // 3. Check timing constraints
            var timingDecision = EvaluateTiming(preferences, effectivePriority, request);

            // 4. Select channels based on all factors
            var channelSelection = SelectChannels(
                preferences,
                availableChannels,
                effectivePriority,
                request.NotificationType,
                request.Template);

            // 5. Build routing decision
            var decision = new NotificationRoutingDecision
            {
                PrimaryChannels = channelSelection.Primary,
                FallbackChannels = channelSelection.Fallback,
                SendImmediately = timingDecision.SendImmediately,
                ScheduledFor = timingDecision.ScheduledFor,
                AddToDigest = timingDecision.AddToDigest,
                EffectivePriority = effectivePriority,
                EstimatedDeliveryTime = timingDecision.EstimatedDeliveryTime,
                PreferencesOverridden = timingDecision.PreferencesOverridden,
                DecisionReason = BuildDecisionReason(channelSelection, timingDecision, effectivePriority)
            };

            // 6. Log routing decision for analytics
            await LogRoutingDecisionAsync(request, decision);

            _logger.LogInformation("Routing decision: {Decision}", JsonSerializer.Serialize(decision));

            return decision;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error routing notification for user {UserId}", request.UserId);

            // Fallback to simple routing
            return GetFallbackRoutingDecision(request);
        }
    }

    public async Task<List<UserChannelInfo>> GetAvailableChannelsAsync(string userId)
    {
        var channels = new List<UserChannelInfo>();

        try
        {
            _logger.LogInformation("🔍 [Router] Fetching available notification channels for user {UserId}", userId);
            _logger.LogDebug("📡 [Router] Sending GET request to UserService: /api/users/internal/{UserId}", userId);

            // Get user data from UserService via ServiceCommunicationManager (internal endpoint with M2M token)
            var userData = await _serviceCommunication.GetAsync<UserProfileResponse>(
                "userservice",
                $"/api/users/internal/{userId}");

            if (userData != null)
            {
                _logger.LogInformation("✅ [Router] User data fetched - Email: {Email}, Phone: {Phone}",
                    userData.Email, userData.PhoneNumber ?? "NULL");

                // Email channel
                if (!string.IsNullOrEmpty(userData.Email))
                {
                    channels.Add(new UserChannelInfo
                    {
                        Channel = NotificationChannel.Email,
                        IsAvailable = true,
                        IsVerified = userData.EmailVerified,
                        Address = userData.Email,
                        Priority = 1,
                        SuccessRate = await CalculateChannelSuccessRateAsync(userId, "EMAIL")
                    });
                    _logger.LogDebug("📧 [Router] Email channel added: {Email} (Verified: {EmailVerified})",
                        userData.Email, userData.EmailVerified);
                }

                // SMS channel
                if (!string.IsNullOrEmpty(userData.PhoneNumber))
                {
                    channels.Add(new UserChannelInfo
                    {
                        Channel = NotificationChannel.SMS,
                        IsAvailable = true,
                        IsVerified = false, // UserProfileResponse doesn't have PhoneVerified
                        Address = userData.PhoneNumber,
                        Priority = 2,
                        SuccessRate = await CalculateChannelSuccessRateAsync(userId, "SMS")
                    });
                    _logger.LogDebug("📱 [Router] SMS channel added: {PhoneNumber}", userData.PhoneNumber);
                }
            }
            else
            {
                _logger.LogWarning("⚠️ [Router] UserService returned NULL for user {UserId}", userId);
            }

            // Push channel (check if user has registered devices)
            var pushTokens = await _dbContext.NotificationPreferences
                .Where(p => p.UserId == userId && !string.IsNullOrEmpty(p.PushToken))
                .Select(p => p.PushToken)
                .FirstOrDefaultAsync();

            if (!string.IsNullOrEmpty(pushTokens))
            {
                channels.Add(new UserChannelInfo
                {
                    Channel = NotificationChannel.Push,
                    IsAvailable = true,
                    IsVerified = true,
                    Address = pushTokens,
                    Priority = 3,
                    SuccessRate = await CalculateChannelSuccessRateAsync(userId, "PUSH")
                });
            }

            // In-App is always available as fallback
            channels.Add(new UserChannelInfo
            {
                Channel = NotificationChannel.InApp,
                IsAvailable = true,
                IsVerified = true,
                Priority = 4,
                SuccessRate = 1.0 // Always succeeds
            });
            _logger.LogDebug("📲 [Router] InApp channel added (always available)");

            _logger.LogInformation("✅ [Router] Available channels for user {UserId}: {Channels}",
                userId, string.Join(", ", channels.Select(c => c.Channel)));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ [Router] Error getting available channels for user {UserId}. Error: {ErrorMessage}", userId, ex.Message);
        }

        return channels;
    }

    private async Task<NotificationPreferences> GetUserPreferencesAsync(string userId)
    {
        _logger.LogDebug("🔍 [Router] Fetching notification preferences for user {UserId}", userId);

        var preferences = await _dbContext.NotificationPreferences
            .FirstOrDefaultAsync(p => p.UserId == userId && !p.IsDeleted);

        if (preferences == null)
        {
            _logger.LogInformation("⚠️ [Router] No preferences found for user {UserId}, using defaults (Email: ON, SMS: OFF, Push: ON)", userId);

            // Return default preferences
            preferences = new NotificationPreferences
            {
                UserId = userId,
                EmailEnabled = true,
                SmsEnabled = false,
                PushEnabled = true,
                EmailDigestEnabled = false,
                DigestFrequency = "daily",
                EmailReminders = true,     // Enable email for appointment reminders
                EmailUpdates = true,       // Enable email for general updates
                EmailSecurity = true,      // Enable email for security alerts
                EmailMarketing = false     // Disable marketing emails by default
            };
        }
        else
        {
            _logger.LogDebug("✅ [Router] Preferences loaded - Email: {EmailEnabled}, SMS: {SmsEnabled}, Push: {PushEnabled}",
                preferences.EmailEnabled, preferences.SmsEnabled, preferences.PushEnabled);
        }

        return preferences;
    }

    private NotificationPriority DetermineEffectivePriority(NotificationRoutingRequest request)
    {
        // Check if template has a predefined priority
        if (_templatePriorityMap.TryGetValue(request.Template, out var templatePriority))
        {
            // Use the higher priority between request and template
            return (NotificationPriority)Math.Max((int)request.Priority, (int)templatePriority);
        }

        return request.Priority;
    }

    private (bool SendImmediately, DateTime? ScheduledFor, bool AddToDigest, DateTime EstimatedDeliveryTime, bool PreferencesOverridden)
        EvaluateTiming(NotificationPreferences preferences, NotificationPriority priority, NotificationRoutingRequest request)
    {
        var now = DateTime.UtcNow;
        var userLocalTime = ConvertToUserTimezone(now, preferences.Timezone ?? "UTC");
        var isQuietHours = IsInQuietHours(preferences, userLocalTime);

        // Critical notifications always send immediately
        if (priority == NotificationPriority.Critical)
        {
            return (true, null, false, now, isQuietHours);
        }

        // Check if user wants digest for low priority
        if (priority == NotificationPriority.Low &&
            preferences.EmailDigestEnabled &&
            request.AllowDigest)
        {
            var nextDigestTime = CalculateNextDigestTime(preferences);
            return (false, nextDigestTime, true, nextDigestTime, false);
        }

        // Respect quiet hours for non-critical
        if (isQuietHours && request.RespectQuietHours)
        {
            var endOfQuietHours = CalculateEndOfQuietHours(preferences, userLocalTime);
            return (false, endOfQuietHours, false, endOfQuietHours, false);
        }

        // Check if user requested specific delivery time
        if (request.RequestedDeliveryTime.HasValue &&
            request.RequestedDeliveryTime.Value > now)
        {
            return (false, request.RequestedDeliveryTime, false, request.RequestedDeliveryTime.Value, false);
        }

        // Send immediately for high priority or if no constraints
        return (true, null, false, now, false);
    }

    private (List<NotificationChannel> Primary, List<NotificationChannel> Fallback) SelectChannels(
        NotificationPreferences preferences,
        List<UserChannelInfo> availableChannels,
        NotificationPriority priority,
        string notificationType,
        string template)
    {
        var primary = new List<NotificationChannel>();
        var fallback = new List<NotificationChannel>();

        // Sort channels by priority and success rate
        var sortedChannels = availableChannels
            .Where(c => c.IsAvailable)
            .OrderBy(c => c.Priority)
            .ThenByDescending(c => c.SuccessRate)
            .ToList();

        // Determine primary channels based on notification type and preferences
        foreach (var channel in sortedChannels)
        {
            if (ShouldUseChannel(channel, preferences, priority, template))
            {
                if (primary.Count < GetMaxPrimaryChannels(priority))
                {
                    primary.Add(channel.Channel);
                }
                else
                {
                    fallback.Add(channel.Channel);
                }
            }
        }

        // Ensure at least one channel for critical notifications
        if (primary.Count == 0 && priority >= NotificationPriority.High)
        {
            // Force email as primary if available
            var emailChannel = sortedChannels.FirstOrDefault(c => c.Channel == NotificationChannel.Email);
            if (emailChannel != null)
            {
                primary.Add(NotificationChannel.Email);
            }
            else
            {
                // Use any available channel
                primary.Add(sortedChannels.First().Channel);
            }
        }

        return (primary, fallback);
    }

    private bool ShouldUseChannel(
        UserChannelInfo channel,
        NotificationPreferences preferences,
        NotificationPriority priority,
        string template)
    {
        // Critical notifications use all verified channels
        if (priority == NotificationPriority.Critical && channel.IsVerified)
        {
            return true;
        }

        // Check user preferences for channel
        return channel.Channel switch
        {
            NotificationChannel.Email => preferences.EmailEnabled && IsEmailAllowedForTemplate(preferences, template),
            NotificationChannel.SMS => preferences.SmsEnabled && IsSmsAllowedForTemplate(preferences, template),
            NotificationChannel.Push => preferences.PushEnabled && IsPushAllowedForTemplate(preferences, template),
            NotificationChannel.InApp => true, // Always allowed as fallback
            _ => false
        };
    }

    private bool IsEmailAllowedForTemplate(NotificationPreferences preferences, string template)
    {
        return template switch
        {
            "security-alert" or "password-reset" or "email-verification" => preferences.EmailSecurity,
            "appointment-reminder" or "appointment-confirmation" => preferences.EmailReminders,
            "skill-match-found" or "message-received" => preferences.EmailUpdates,
            "newsletter" or "tips-and-tricks" => preferences.EmailMarketing,
            _ => preferences.EmailUpdates
        };
    }

    private bool IsSmsAllowedForTemplate(NotificationPreferences preferences, string template)
    {
        return template switch
        {
            "security-alert" or "two-factor-code" => preferences.SmsSecurity,
            "appointment-reminder" => preferences.SmsReminders,
            _ => false // SMS is expensive, only for specific cases
        };
    }

    private bool IsPushAllowedForTemplate(NotificationPreferences preferences, string template)
    {
        return template switch
        {
            "security-alert" => preferences.PushSecurity,
            "message-received" or "skill-match-found" => preferences.PushUpdates,
            "appointment-reminder" => preferences.PushReminders,
            _ => preferences.PushUpdates
        };
    }

    private int GetMaxPrimaryChannels(NotificationPriority priority)
    {
        return priority switch
        {
            NotificationPriority.Critical => 3, // Use all channels
            NotificationPriority.High => 2,
            NotificationPriority.Normal => 1,
            NotificationPriority.Low => 1,
            _ => 1
        };
    }

    private async Task<double> CalculateChannelSuccessRateAsync(string userId, string channelType)
    {
        var thirtyDaysAgo = DateTime.UtcNow.AddDays(-30);

        var stats = await _dbContext.Notifications
            .Where(n => n.UserId == userId &&
                       n.Type == channelType &&
                       n.CreatedAt >= thirtyDaysAgo)
            .GroupBy(n => n.Status)
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .ToListAsync();

        var total = stats.Sum(s => s.Count);
        if (total == 0) return 1.0; // No data, assume success

        var successful = stats
            .Where(s => s.Status == NotificationStatus.Sent)
            .Sum(s => s.Count);

        return (double)successful / total;
    }

    private bool IsInQuietHours(NotificationPreferences preferences, DateTime userLocalTime)
    {
        if (!preferences.QuietHoursStart.HasValue || !preferences.QuietHoursEnd.HasValue)
            return false;

        var currentTime = TimeOnly.FromDateTime(userLocalTime);
        var start = preferences.QuietHoursStart.Value;
        var end = preferences.QuietHoursEnd.Value;

        if (start <= end)
        {
            return currentTime >= start && currentTime <= end;
        }
        else
        {
            // Quiet hours span midnight
            return currentTime >= start || currentTime <= end;
        }
    }

    private DateTime ConvertToUserTimezone(DateTime utcTime, string timezone)
    {
        try
        {
            var timeZoneInfo = TimeZoneInfo.FindSystemTimeZoneById(timezone);
            return TimeZoneInfo.ConvertTimeFromUtc(utcTime, timeZoneInfo);
        }
        catch
        {
            return utcTime; // Fallback to UTC if timezone is invalid
        }
    }

    private DateTime CalculateEndOfQuietHours(NotificationPreferences preferences, DateTime userLocalTime)
    {
        if (!preferences.QuietHoursEnd.HasValue)
            return DateTime.UtcNow.AddHours(1);

        var tomorrow = userLocalTime.Date.AddDays(1);
        var endTime = tomorrow.Add(preferences.QuietHoursEnd.Value.ToTimeSpan());

        // Convert back to UTC
        try
        {
            var timeZoneInfo = TimeZoneInfo.FindSystemTimeZoneById(preferences.Timezone ?? "UTC");
            return TimeZoneInfo.ConvertTimeToUtc(endTime, timeZoneInfo);
        }
        catch
        {
            return DateTime.UtcNow.AddHours(8); // Default to 8 hours later
        }
    }

    private DateTime CalculateNextDigestTime(NotificationPreferences preferences)
    {
        var now = DateTime.UtcNow;
        var userLocalTime = ConvertToUserTimezone(now, preferences.Timezone ?? "UTC");

        // Default digest time is 6 PM user local time
        var digestHour = preferences.DigestHour;
        var nextDigest = userLocalTime.Date.AddHours(digestHour);

        if (nextDigest <= userLocalTime)
        {
            // If we've passed today's digest time, schedule for tomorrow
            nextDigest = nextDigest.AddDays(1);
        }

        // Handle different digest frequencies
        switch (preferences.DigestFrequency?.ToLower())
        {
            case "weekly":
                // Send on Mondays
                while (nextDigest.DayOfWeek != DayOfWeek.Monday)
                {
                    nextDigest = nextDigest.AddDays(1);
                }
                break;
            case "monthly":
                // Send on the 1st of the month
                if (nextDigest.Day != 1)
                {
                    nextDigest = new DateTime(nextDigest.Year, nextDigest.Month, 1)
                        .AddMonths(1)
                        .AddHours(digestHour);
                }
                break;
            default: // daily
                // Already set to next occurrence
                break;
        }

        // Convert back to UTC
        try
        {
            var timeZoneInfo = TimeZoneInfo.FindSystemTimeZoneById(preferences.Timezone ?? "UTC");
            return TimeZoneInfo.ConvertTimeToUtc(nextDigest, timeZoneInfo);
        }
        catch
        {
            return now.AddHours(24);
        }
    }

    private string BuildDecisionReason(
        (List<NotificationChannel> Primary, List<NotificationChannel> Fallback) channels,
        (bool SendImmediately, DateTime? ScheduledFor, bool AddToDigest, DateTime EstimatedDeliveryTime, bool PreferencesOverridden) timing,
        NotificationPriority priority)
    {
        var reasons = new List<string>();

        reasons.Add($"Priority: {priority}");

        if (timing.SendImmediately)
        {
            reasons.Add("Sending immediately");
        }
        else if (timing.AddToDigest)
        {
            reasons.Add("Added to digest");
        }
        else if (timing.ScheduledFor.HasValue)
        {
            reasons.Add($"Scheduled for {timing.ScheduledFor:yyyy-MM-dd HH:mm}");
        }

        if (timing.PreferencesOverridden)
        {
            reasons.Add("User preferences overridden due to priority");
        }

        reasons.Add($"Primary channels: {string.Join(", ", channels.Primary)}");

        if (channels.Fallback.Any())
        {
            reasons.Add($"Fallback channels: {string.Join(", ", channels.Fallback)}");
        }

        return string.Join("; ", reasons);
    }

    private NotificationRoutingDecision GetFallbackRoutingDecision(NotificationRoutingRequest request)
    {
        // Simple fallback when routing fails
        return new NotificationRoutingDecision
        {
            PrimaryChannels = new List<NotificationChannel> { NotificationChannel.Email },
            FallbackChannels = new List<NotificationChannel> { NotificationChannel.InApp },
            SendImmediately = request.Priority >= NotificationPriority.High,
            EffectivePriority = request.Priority,
            EstimatedDeliveryTime = DateTime.UtcNow,
            DecisionReason = "Fallback routing due to error"
        };
    }

    private Task LogRoutingDecisionAsync(NotificationRoutingRequest request, NotificationRoutingDecision decision)
    {
        try
        {
            // ⚠️ FIXED: Don't insert into NotificationEvents table for routing decisions
            // NotificationEvents has a FK constraint to Notifications table
            // Routing decisions should be logged to file/monitoring system instead

            _logger.LogInformation("📊 [Router] Routing Decision Logged - User: {UserId}, Type: {Type}, Template: {Template}, Priority: {Priority}, Channels: {Channels}, SendImmediate: {SendImmediately}",
                request.UserId,
                request.NotificationType,
                request.Template,
                decision.EffectivePriority,
                string.Join(", ", decision.PrimaryChannels),
                decision.SendImmediately);

            _logger.LogDebug("📋 [Router] Full Decision: {DecisionReason}", decision.DecisionReason);

            // Note: If we need to persist routing analytics, create a separate RoutingDecisionLog table
            // without FK constraints to Notifications
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ [Router] Failed to log routing decision for user {UserId}", request.UserId);
        }

        return Task.CompletedTask;
    }

}