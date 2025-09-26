import { Match, MatchStatus } from '../types/models/Match';
import { MatchDisplay } from '../types/contracts/MatchmakingDisplay';

/**
 * Transform Match to MatchDisplay
 * Handles the missing properties by providing defaults or mapping existing ones
 */
export const transformMatchToDisplay = (match: Match): MatchDisplay => {
  return {
    id: match.id,
    skillId: match.skillId,
    skillName: match.skill?.name || 'Unknown Skill',
    skillCategory: match.skill?.category?.name || 'General',
    status: mapStatusToDisplay(match.status),
    
    // Partner info (use requester or responder details)
    partnerId: match.requesterId,
    partnerName: match.requesterDetails?.firstName || match.requesterDetails?.email || 'Unknown',
    partnerRating: 4.5, // Default rating
    partnerAvatar: match.requesterDetails?.profilePictureUrl,
    
    // Additional user info for compatibility
    otherUserName: match.responderDetails?.firstName || match.responderDetails?.email || 'Unknown',
    otherUserRating: 4.5,
    otherUserId: match.responderId,
    
    // Legacy compatibility properties
    requesterId: match.requesterId,
    requesterDetails: match.requesterDetails ? {
      name: match.requesterDetails.firstName || match.requesterDetails.email || 'Unknown',
      rating: 4.5,
      avatar: match.requesterDetails.profilePictureUrl
    } : undefined,
    responderId: match.responderId,
    responderDetails: match.responderDetails ? {
      name: match.responderDetails.firstName || match.responderDetails.email || 'Unknown', 
      rating: 4.5,
      avatar: match.responderDetails.profilePictureUrl
    } : undefined,
    skill: match.skill ? {
      name: match.skill.name,
      category: match.skill.category?.name || 'General'
    } : undefined,
    
    // Exchange info (defaults to false since not in Match)
    isSkillExchange: false,
    exchangeSkillId: undefined,
    exchangeSkillName: undefined,
    
    // Monetary info (defaults to false since not in Match)
    isMonetary: false,
    offeredAmount: undefined,
    currency: undefined,
    
    // Session info (placeholder)
    sessionInfo: {
      completedSessions: 0,
      totalSessions: 1,
      nextSessionDate: undefined
    },
    
    // Match details
    isOffering: true, // Default assumption
    compatibilityScore: match.compatibilityScore,
    location: undefined,
    rating: 4.5,
    
    // Timestamps
    createdAt: match.createdAt,
    acceptedAt: match.acceptedAt,
    completedAt: undefined,

    // From original Match interface
    isLearningMode: match.isLearningMode,
    preferredDays: match.preferredDays,
    preferredTimes: match.preferredTimes,
  };
};

/**
 * Map Match status to MatchDisplay status
 */
const mapStatusToDisplay = (status: MatchStatus): MatchDisplay['status'] => {
  switch (status) {
    case MatchStatus.Pending:
      return 'pending';
    case MatchStatus.Accepted:
      return 'accepted';
    case MatchStatus.Rejected:
      return 'rejected';
    case MatchStatus.Completed:
      return 'completed';
    case MatchStatus.Expired:
      return 'cancelled';
    default:
      return 'pending';
  }
};

// import { Match, MatchStatus } from '../types/models/Match';
// import { User } from '../types/models/User';
// import { Skill } from '../types/models/Skill';
// import { MatchDetailsResponse, ApiUserDetails, ApiSkillDetails, MatchRequestResponse, UserMatchItem, CreateMatchRequestResponse } from '../types/api/MatchmakingTypes';
// import { MatchRequestItem } from '../types/states/MatchmakingState';
// import { MatchRequest } from '../types/contracts/requests/MatchRequest';

// /**
// //  * Transform API User Details to full User model
//  */
// export function transformApiUserToUser(apiUser: ApiUserDetails): User {
//   return {
//     id: apiUser.id,
//     email: apiUser.email || `${apiUser.id}@example.com`, // Fallback for required field
//     firstName: apiUser.firstName || apiUser.name.split(' ')[0] || 'Unknown',
//     lastName: apiUser.lastName || apiUser.name.split(' ').slice(1).join(' ') || '',
//     userName: apiUser.userName || apiUser.name,
//     phoneNumber: apiUser.phoneNumber,
//     bio: apiUser.bio,
//     timeZone: apiUser.timeZone,
//     roles: apiUser.roles || ['user'],
//     permissions: apiUser.pe
//     emailVerified: apiUser.emailVerified || false,
//     accountStatus: apiUser.accountStatus || 'active',
//     createdAt: apiUser.createdAt || new Date().toISOString(),
//     lastLoginAt: apiUser.lastLoginAt,
//     preferences: apiUser.preferences,
//     profilePictureUrl: apiUser.avatar || apiUser.profilePictureUrl,
//   };
// }

// /**
//  * Transform API Skill Details to full Skill model
//  */
// export function transformApiSkillToSkill(apiSkill: ApiSkillDetails): Skill {
//   return {
//     id: apiSkill.id,
//     userId: apiSkill.userId || 'unknown',
//     name: apiSkill.name,
//     description: apiSkill.description || '',
//     isOffered: apiSkill.isOffered || true,
//     endorsementCount: apiSkill.endorsementCount || 0,
//     category: apiSkill.proficiencyLevel || {
//       categoryId: 'general',
//       name: apiSkill.category,
//       isActive: true,
//       createdAt: new Date().toISOString()
//     },
//     proficiencyLevel: apiSkill.proficiencyLevel || {
//       levelId: 'intermediate',
//       level: 'Intermediate',
//       rank: 3,
//       isActive: true,
//       createdAt: new Date().toISOString()
//     },
//     tagsJson: apiSkill.tagsJson || '[]',
//     averageRating: apiSkill.averageRating,
//     reviewCount: apiSkill.reviewCount,
//     estimatedDurationMinutes: apiSkill.estimatedDurationMinutes,
//     createdAt: apiSkill.createdAt || new Date().toISOString(),
//     lastActiveAt: apiSkill.lastActiveAt,
//     matchRequests: apiSkill.matchRequests,
//     activeMatches: apiSkill.activeMatches,
//     completionRate: apiSkill.completionRate,
//     isVerified: apiSkill.isVerified,
//   };
// }

// /**
//  * Transform MatchDetailsResponse to Match model
//  */
// export function transformMatchDetailsToMatch(matchDetails: MatchDetailsResponse): Match {
//   return {
//     id: matchDetails.id,
//     requesterId: matchDetails.requesterId,
//     requesterDetails: transformApiUserToUser(matchDetails.requesterDetails),
//     responderId: matchDetails.responderId,
//     responderDetails: transformApiUserToUser(matchDetails.responderDetails),
//     skillId: matchDetails.skillId,
//     skill: transformApiSkillToSkill(matchDetails.skill),
//     isLearningMode: matchDetails.isLearningMode,
//     status: matchDetails.status as MatchStatus,
//     preferredDays: matchDetails.preferredDays,
//     preferredTimes: matchDetails.preferredTimes,
//     additionalNotes: matchDetails.additionalNotes,
//     compatibilityScore: matchDetails.compatibilityScore,
//     createdAt: matchDetails.createdAt,
//     updatedAt: matchDetails.updatedAt,
//     acceptedAt: matchDetails.acceptedAt,
//   };
// }

// /**
//  * Transform MatchRequestResponse to MatchRequestItem for UI - SIMPLIFIED
//  */
// export function transformMatchRequestToItem(
//   matchRequest: MatchRequestResponse, 
//   type: 'incoming' | 'outgoing'
// ): MatchRequestItem {
//   return {
//     id: matchRequest.requestId,
//     requesterId: matchRequest.requesterId,
//     targetUserId: matchRequest.targetUserId,
//     skillId: matchRequest.skillId,
//     description: matchRequest.description,
//     message: matchRequest.message,
//     status: matchRequest.status,
//     createdAt: matchRequest.createdAt,
//     respondedAt: matchRequest.respondedAt,
//     expiresAt: matchRequest.expiresAt,
//     threadId: matchRequest.threadId,
//     isSkillExchange: matchRequest.isSkillExchange,
//     exchangeSkillId: matchRequest.exchangeSkillId,
//     isMonetary: matchRequest.isMonetary,
//     offeredAmount: matchRequest.offeredAmount,
//     currency: matchRequest.currency,
//     sessionDurationMinutes: matchRequest.sessionDurationMinutes,
//     totalSessions: matchRequest.totalSessions,
//     preferredDays: matchRequest.preferredDays,
//     preferredTimes: matchRequest.preferredTimes,
//     // UI-specific properties
//     type,
//     isRead: true, // Default to read for now
//     user: {
//       name: type === 'incoming' ? matchRequest.requesterName : matchRequest.targetUserName,
//       rating: 4.5, // Placeholder rating
//       avatar: undefined // No avatar in response
//     },
//     skill: {
//       name: matchRequest.skillName,
//       category: matchRequest.skillCategory,
//       isOffered: true
//     },
//     exchangeSkill: matchRequest.exchangeSkillId ? {
//       name: matchRequest.exchangeSkillName || 'Exchange Skill'
//     } : undefined
//   };
// }

// /**
//  * Transform UserMatchItem to Match model for getUserMatches
//  */
// export function transformUserMatchToMatch(userMatch: UserMatchItem): Match {
//   return {
//     id: userMatch.MatchId,
//     requesterId: userMatch.IsOffering ? 'current-user' : 'other-user',
//     requesterDetails: {
//       id: userMatch.IsOffering ? 'current-user' : 'other-user',
//       email: 'user@example.com',
//       firstName: 'User',
//       lastName: '',
//       userName: 'User',
//       phoneNumber: undefined,
//       bio: undefined,
//       timeZone: undefined,
//       roles: ['user'],
//       emailVerified: false,
//       accountStatus: 'active',
//       createdAt: new Date().toISOString(),
//       lastLoginAt: undefined,
//       preferences: undefined,
//       profilePictureUrl: undefined,
//     },
//     responderId: userMatch.IsOffering ? 'other-user' : 'current-user',
//     responderDetails: {
//       id: userMatch.IsOffering ? 'other-user' : 'current-user',
//       email: 'other@example.com',
//       firstName: 'Other',
//       lastName: 'User',
//       userName: 'Other User',
//       phoneNumber: undefined,
//       bio: undefined,
//       timeZone: undefined,
//       roles: ['user'],
//       emailVerified: false,
//       accountStatus: 'active',
//       createdAt: new Date().toISOString(),
//       lastLoginAt: undefined,
//       preferences: undefined,
//       profilePictureUrl: undefined,
//     },
//     skillId: 'unknown-skill',
//     skill: {
//       id: 'unknown-skill',
//       userId: 'unknown',
//       name: userMatch.SkillName,
//       description: '',
//       isOffered: true,
//       endorsementCount: 0,
//       category: {
//         id: 'general',
//         name: 'General',
//       },
//       proficiencyLevel: {
//         id: 'intermediate',
//         level: 'Intermediate',
//         rank: 3,
//       },
//       tagsJson: '[]',
//       averageRating: undefined,
//       reviewCount: undefined,
//       estimatedDurationMinutes: undefined,
//       createdAt: new Date().toISOString(),
//       lastActiveAt: undefined,
//       matchRequests: undefined,
//       activeMatches: undefined,
//       completionRate: undefined,
//       isVerified: undefined,
//     },
//     isLearningMode: !userMatch.IsOffering,
//     status: userMatch.Status as MatchStatus,
//     preferredDays: [],
//     preferredTimes: [],
//     additionalNotes: '',
//     compatibilityScore: userMatch.CompatibilityScore || 0,
//     createdAt: userMatch.CreatedAt,
//     updatedAt: userMatch.CreatedAt,
//     acceptedAt: userMatch.AcceptedAt,
//   };
// }

// /**
//  * Transform CreateMatchRequestResponse to MatchRequest model
//  */
// export function transformCreateMatchRequestToMatchRequest(
//   response: CreateMatchRequestResponse,
//   originalRequest: { skillId: string; description: string; message: string }
// ): MatchRequest {
//   return {
//     id: response.RequestId,
//     threadId : response.ThreadId,
//     // matchId: response.RequestId,
//     requesterId: 'current-user', // Current user is creating the request
//     // requesterName: 'Current User',
//     targetUserId: 'unknown-target', // Not available in CreateMatchRequest
//     skillId: originalRequest.skillId,
//     isSkillExchange: false,
//     // skillName: originalRequest.description, // Use description as skill name
//     message: originalRequest.message,
//     isOffered: true, // Default assumption for created requests
//     status: response.Status,
//     expiresAt: undefined,
//   };
// }