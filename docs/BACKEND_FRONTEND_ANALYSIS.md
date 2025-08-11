# Backend-Frontend Pipeline Analysis

## Phase 1.1: UserService Analysis

### ✅ Commands Found (23)
1. **LoginUserCommand** → `ApiResponse<LoginResponse>`
2. **RegisterUserCommand** → `ApiResponse<RegisterResponse>`
3. **RefreshTokenCommand** → `ApiResponse<RefreshTokenResponse>`
4. **VerifyEmailCommand** → `ApiResponse<VerifyEmailResponse>`
5. **ResendVerificationCommand** → `ApiResponse<ResendVerificationResponse>`
6. **RequestPasswordResetCommand** → `ApiResponse<RequestPasswordResetResponse>`
7. **ResetPasswordCommand** → `ApiResponse<ResetPasswordResponse>`
8. **ChangePasswordCommand** → `ApiResponse<ChangePasswordResponse>`
9. **UpdateUserProfileCommand** → `ApiResponse<UpdateUserProfileResponse>`
10. **CreateFirstAdminCommand** → `ApiResponse<CreateFirstAdminResponse>`
11. **AssignUserRoleCommand** → `ApiResponse<AssignUserRoleResponse>`
12. **AddFavoriteSkillCommand** → `ApiResponse<AddFavoriteSkillResponse>`
13. **RemoveFavoriteSkillCommand** → `ApiResponse<RemoveFavoriteSkillResponse>`
14. **GenerateTwoFactorSecretCommand** → `ApiResponse<GenerateTwoFactorSecretResponse>`
15. **VerifyTwoFactorCodeCommand** → `ApiResponse<VerifyTwoFactorCodeResponse>`
16. **DisableTwoFactorCommand** → `ApiResponse<DisableTwoFactorResponse>`
17. **BlockUserCommand** → `ApiResponse<BlockUserResponse>`
18. **UnblockUserCommand** → `ApiResponse<UnblockUserResponse>`
19. **UpdateNotificationPreferencesCommand** → `ApiResponse<UpdateNotificationPreferencesResponse>`
20. **UpdateUserAvailabilityCommand** → `ApiResponse<UpdateUserAvailabilityResponse>`
21. **UpdateUserStatusCommand** → `ApiResponse<UpdateUserStatusResponse>`
22. **UploadAvatarCommand** → `ApiResponse<UploadAvatarResponse>`
23. **DeleteAvatarCommand** → `ApiResponse<DeleteAvatarResponse>`

### ✅ Queries Found (15)
1. **CheckEmailAvailabilityQuery** → `ApiResponse<EmailAvailabilityResponse>`
2. **GetAllUsersQuery** → `PagedResponse<UserResponse>`
3. **GetBlockedUsersQuery** → `PagedResponse<UserResponse>`
4. **GetFavoriteSkillsQuery** → `ApiResponse<List<FavoriteSkillResponse>>`
5. **GetNotificationPreferencesQuery** → `ApiResponse<NotificationPreferencesResponse>`
6. **GetPublicUserProfileQuery** → `ApiResponse<PublicUserProfileResponse>`
7. **GetTwoFactorStatusQuery** → `ApiResponse<GetTwoFactorStatusResponse>`
8. **GetUserActivityLogQuery** → `PagedResponse<UserActivityLogResponse>`
9. **GetUserAvailabilityQuery** → `ApiResponse<UserAvailabilityResponse>`
10. **GetUserByEmailQuery** → `ApiResponse<UserResponse>`
11. **GetUserProfileQuery** → `ApiResponse<UserProfileResponse>`
12. **GetUserRolesQuery** → `ApiResponse<List<RoleResponse>>`
13. **GetUserStatisticsQuery** → `ApiResponse<UserStatisticsResponse>`
14. **SearchUsersQuery** → `PagedResponse<UserSearchResponse>`
15. **ValidateUserCredentialsQuery** → `ApiResponse<ValidateUserCredentialsResponse>`

### ✅ Response Wrappers
- **ApiResponse<T>**: Standard single-item response wrapper
  - Properties: `success`, `data`, `message`, `errors`, `timestamp`, `traceId`
- **PagedResponse<T>**: Paginated list response wrapper (extends ApiResponse<List<T>>)
  - Additional Properties: `pageNumber`, `pageSize`, `totalPages`, `totalRecords`, `hasNextPage`, `hasPreviousPage`

### ⚠️ Gateway Routing Issues Found

#### 1. Missing `/users/auth/` prefix:
- `/reset-password` → Should be `/users/auth/reset-password`
- `/change-password` → Should be `/users/auth/change-password`

#### 2. Inconsistent profile routes:
- Route 87: `/profile` → Should be `/users/profile`
- Route 97: `/users/profile` (duplicate)

#### 3. Permission routes inconsistency:
- Some use `/users/permissions/` 
- Others use `/permission/` directly

### 🔧 Frontend Service Issues

#### authService.ts Analysis:
1. **login()** - ✅ Correctly uses `ApiResponse<LoginResponse>`
2. **register()** - ❌ Returns `RegisterResponse` directly, should use `ApiResponse<RegisterResponse>`
3. **getProfile()** - ❌ Returns `UserProfileResponse` directly, should use `ApiResponse<UserProfileResponse>`
4. **updateProfile()** - ❌ Returns `UpdateUserProfileResponse` directly, should use `ApiResponse<UpdateUserProfileResponse>`

#### skillsSlice.ts Analysis:
1. Using custom response types instead of `ApiResponse<T>` wrapper
2. Need to update service calls to handle `ApiResponse<T>` and `PagedResponse<T>`
3. Mapping functions need adjustment for wrapped responses

## Issues to Fix

### 1. Gateway Routes (ocelot.json)
```json
// Fix these routes:
{
  "DownstreamPathTemplate": "/users/auth/reset-password",  // was: "/reset-password"
  "UpstreamPathTemplate": "/api/users/reset-password"
}
{
  "DownstreamPathTemplate": "/users/auth/change-password",  // was: "/change-password"
  "UpstreamPathTemplate": "/api/users/change-password"
}
```

### 2. Frontend Services Pattern
All frontend services should follow this pattern:

```typescript
// ❌ Wrong
async getProfile(): Promise<UserProfileResponse> {
  return apiClient.get<UserProfileResponse>(AUTH_ENDPOINTS.PROFILE);
}

// ✅ Correct
async getProfile(): Promise<ApiResponse<UserProfileResponse>> {
  return httpClient.get<ApiResponse<UserProfileResponse>>(AUTH_ENDPOINTS.PROFILE);
}
```

### 3. Redux Slice Pattern
```typescript
// Handle ApiResponse in slices
.addCase(fetchUserProfile.fulfilled, (state, action) => {
  if (action.payload.success && action.payload.data) {
    state.profile = action.payload.data;
  }
})
```

## Next Steps
1. Fix ocelot.json routing issues
2. Update all frontend services to use ApiResponse<T> and PagedResponse<T>
3. Update Redux slices to handle wrapped responses
4. Test complete data flow from backend to UI