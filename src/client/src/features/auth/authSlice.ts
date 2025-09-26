import { createSlice, UnknownAction } from '@reduxjs/toolkit';
import { removeToken } from '../../utils/authHelpers';
import { withDefault, isDefined } from '../../utils/safeAccess';
import errorService from '../../services/errorService';
import { ErrorResponse } from '../../types/api/UnifiedResponse';
import { initialUsersState } from '../../store/adapters/authAdapter+State';
import { login, register, refreshToken, getProfile, updateProfile, uploadProfilePicture, changePassword, silentLogin, logout, verifyEmail, generateTwoFactorSecret, verifyTwoFactorCode, getTwoFactorStatus, disableTwoFactor } from './authThunks';

// Slice
const authSlice = createSlice({
  name: 'auth',
  initialState: initialUsersState,
  reducers: {
    clearError: (state) => {
      state.errorMessage = undefined;
    },
    setError: (state, action) => {
      state.errorMessage = action.payload;
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    clearTwoFactorState: (state) => {
      state.pendingLoginCredentials = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.fulfilled, (state, action) => {
        const response = action.payload;
        // 2FA required branch
        if (response.data?.requires2FA) {
          state.isLoading = false;
          state.isAuthenticated = false;
          state.pendingLoginCredentials = action.meta.arg;
          return;
        }

        state.isLoading = false;
        state.isAuthenticated = true;
        state.pendingLoginCredentials = null;

        const userData = response.data?.userInfo;
        state.user = isDefined(userData)
          ? {
              id: withDefault(userData.userId, ''),
              email: withDefault(userData.email, ''),
              firstName: withDefault(userData.firstName, ''),
              lastName: withDefault(userData.lastName, ''),
              userName: withDefault(userData.userName, ''),
              roles: withDefault(userData.roles, []),
              favoriteSkills: userData.favoriteSkills,
              emailVerified: withDefault(userData.emailVerified, false),
              accountStatus: withDefault(userData.accountStatus, 'active'),
              twoFactorEnabled: false, // TODO - muss vom backend mitkommen
              twoFactorRequired: false // TODO - muss vom backend mutkommen
            }
          : null;


        if (state.user) {
          errorService.setUserContext(state.user.id, state.user.email, state.user.userName);
          errorService.addBreadcrumb('User logged in', 'auth', { userId: state.user.id, method: 'standard' });
        }

        // ✅ SECURITY FIX: Removed localStorage permission storage - permissions now handled by PermissionContext
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;

        const response = action.payload;
        const userData = response.data?.userInfo;
        state.user = isDefined(userData)
          ? {
              id: withDefault(userData.userId, ''),
              email: withDefault(userData.email, ''),
              firstName: withDefault(userData.firstName, ''),
              lastName: withDefault(userData.lastName, ''),
              userName: withDefault(userData.userName, ''),
              roles: withDefault(userData.roles, ['User']),
              favoriteSkills: userData.favoriteSkills,
              emailVerified: withDefault(userData.emailVerified, false),
              accountStatus: withDefault(userData.accountStatus, 'PendingVerification'),
              twoFactorEnabled: false, // TODO - muss vom backend mitkommen
              twoFactorRequired: false // TODO - muss vom backend mutkommen
            }
          : null;

        if (state.user) {
          errorService.setUserContext(state.user.id, state.user.email, state.user.userName);
          errorService.addBreadcrumb('User registered', 'auth', { userId: state.user.id, method: 'registration' });
        }

        // ✅ SECURITY FIX: Removed localStorage permission storage - permissions now handled by PermissionContext
      })
      // Token Refresh
      .addCase(refreshToken.fulfilled, (state) => {
        state.isLoading = false;
        state.errorMessage = undefined;
        // ✅ FIXED: Don't read from localStorage in reducer - use action payload
        state.isAuthenticated = true;
        // Keep user data intact during refresh
      })
      .addCase(refreshToken.rejected, (state) => {
        state.isAuthenticated = false;
        state.user = null;
      })
      // Get Profile
      .addCase(getProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        const profileData = action.payload.data;
        state.user = 
        { 
          id: action.payload.data.userId,
          ...profileData,
        };
      })
      // Update Profile
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        const updateData = action.payload.data;
        state.user = 
        { 
          id: action.payload.data.userId,
          favoriteSkills: state.user?.favoriteSkills ?? [], ...updateData 
        };
      })
      // Upload Profile Picture
      .addCase(uploadProfilePicture.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.data;
      })
      // Change Password
      .addCase(changePassword.fulfilled, (state) => {
        state.isLoading = false;
      })
      // Silent Login
      .addCase(silentLogin.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
      })
      .addCase(silentLogin.rejected, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
      })
      // Logout
      .addCase(logout.fulfilled, (state) => {
        errorService.setUserContext('', '', '');
        errorService.clearBreadcrumbs();
        errorService.addBreadcrumb('User logged out', 'auth');

        state.user = null;
        state.isAuthenticated = false;
        state.isLoading = false;
        state.errorMessage = undefined;

        // ✅ SECURITY FIX: No longer storing permissions in localStorage - handled by PermissionContext
        removeToken();
      })
      // Email Verification
      .addCase(verifyEmail.fulfilled, (state) => {
        state.isLoading = false;
        if (state.user) state.user.emailVerified = true;
      })
      // 2FA flow
      .addCase(generateTwoFactorSecret.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(verifyTwoFactorCode.fulfilled, (state) => {
        state.isLoading = false;
        state.pendingLoginCredentials = null;
      })
      .addCase(getTwoFactorStatus.fulfilled, (state, _) => {
        state.isLoading = false;
      })
      .addCase(disableTwoFactor.fulfilled, (state) => {
        state.isLoading = false;
      })
      // ---- Generic matchers: pending + rejectedWithValue (ONLY for auth actions)
      .addMatcher(
        (action) => action.type.startsWith('auth/') && action.type.endsWith('/pending'),
        (state) => {
          state.isLoading = true;
          state.errorMessage = undefined;
        }
      )
      .addMatcher(
        (action) => action.type.startsWith('auth/') && (action.type.endsWith('/rejected') || action.type.endsWith('/fulfilled')),
        (state, action: UnknownAction) => {
          state.isLoading = false;
          state.errorMessage = action.type
          // Only set error for rejected actions
          if (action.type.endsWith('/rejected')) {
            state.errorMessage = (action.payload as ErrorResponse)?.message ?? 'Unbekannter Fehler';
          }
        }
      );
  },
});

export const { clearError, setError, setLoading, clearTwoFactorState } = authSlice.actions;
export default authSlice.reducer;
