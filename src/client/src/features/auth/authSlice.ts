import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { removeToken } from '../../utils/authHelpers';
import { withDefault, isDefined } from '../../utils/safeAccess';
import errorService from '../../services/errorService';
import type { ErrorResponse } from '../../types/api/UnifiedResponse';
import { initialUsersState, type UsersEntityState } from '../../store/adapters/authAdapter+State';
import type { User } from '../../types/models/User';
import {
  login,
  register,
  refreshToken,
  getProfile,
  updateProfile,
  uploadProfilePicture,
  changePassword,
  silentLogin,
  logout,
  verifyEmail,
  generateTwoFactorSecret,
  verifyTwoFactorCode,
  getTwoFactorStatus,
  disableTwoFactor,
} from './authThunks';

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Maps UserInfo from API response to User model
 * Eliminates code duplication between login and register
 */
const mapUserInfoToUser = (
  userData:
    | {
        userId?: string;
        email?: string;
        firstName?: string;
        lastName?: string;
        userName?: string;
        roles?: string[];
        favoriteSkills?: string[];
        emailVerified?: boolean;
        accountStatus?: string;
        twoFactorEnabled?: boolean;
      }
    | undefined,
  defaults?: Partial<User>
): User | undefined => {
  if (!isDefined(userData)) return undefined;

  return {
    id: withDefault(userData.userId, ''),
    email: withDefault(userData.email, ''),
    firstName: withDefault(userData.firstName, ''),
    lastName: withDefault(userData.lastName, ''),
    userName: withDefault(userData.userName, ''),
    roles: withDefault(userData.roles, defaults?.roles ?? []),
    favoriteSkills: userData.favoriteSkills,
    emailVerified: withDefault(userData.emailVerified, false),
    accountStatus: withDefault(userData.accountStatus, defaults?.accountStatus ?? 'active'),
    twoFactorEnabled: withDefault(userData.twoFactorEnabled, false),
    twoFactorRequired: false, // TODO: Backend should provide this
  };
};

/**
 * Sets error service user context after successful auth
 */
const setErrorServiceContext = (user: User | undefined, action: string): void => {
  if (user) {
    errorService.setUserContext(user.id, user.email, user.userName);
    errorService.addBreadcrumb(`User ${action}`, 'auth', {
      userId: user.id,
      method: action === 'logged in' ? 'standard' : 'registration',
    });
  }
};

/**
 * Extracts error message from rejected action payload
 */
const extractErrorMessage = (payload: ErrorResponse | Error | undefined): string | undefined => {
  // Handle ErrorResponse type
  if (typeof payload === 'object') {
    const errorResponse = payload as ErrorResponse;

    // Try message first
    if (errorResponse.message) {
      return errorResponse.message;
    }

    // Try errors array
    if (Array.isArray(errorResponse.errors) && errorResponse.errors.length > 0) {
      return errorResponse.errors[0];
    }
  }

  return 'Ein unbekannter Fehler ist aufgetreten';
};

// ============================================
// SLICE DEFINITION
// ============================================

const authSlice = createSlice({
  name: 'auth',
  initialState: initialUsersState,
  reducers: {
    /**
     * Clears any error message in auth state
     */
    clearError: (state) => {
      state.errorMessage = undefined;
    },

    /**
     * Sets a specific error message
     */
    setError: (state, action: PayloadAction<string | undefined>) => {
      state.errorMessage = action.payload;
    },

    /**
     * Sets loading state manually
     */
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    /**
     * Clears pending 2FA login credentials
     */
    clearTwoFactorState: (state) => {
      state.pendingLoginCredentials = undefined;
    },

    /**
     * Updates user data partially (for optimistic updates)
     */
    updateUserPartial: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },

    /**
     * Resets entire auth state (for testing or force logout)
     */
    resetAuthState: () => initialUsersState,
  },

  extraReducers: (builder) => {
    builder
      // ============================================
      // LOGIN
      // ============================================
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.errorMessage = undefined;
      })
      .addCase(login.fulfilled, (state, action) => {
        const response = action.payload;
        state.isLoading = false;
        state.errorMessage = undefined;

        // Handle 2FA required
        if (response.data.requires2FA) {
          state.isAuthenticated = false;
          state.pendingLoginCredentials = action.meta.arg;
          return;
        }

        // Successful login
        state.isAuthenticated = true;
        state.pendingLoginCredentials = undefined;
        state.user = mapUserInfoToUser(response.data.userInfo);

        setErrorServiceContext(state.user, 'logged in');
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.errorMessage = extractErrorMessage(action.payload);
      })

      // ============================================
      // REGISTER
      // ============================================
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.errorMessage = undefined;
      })
      .addCase(register.fulfilled, (state, action) => {
        const response = action.payload;
        state.isLoading = false;
        state.errorMessage = undefined;
        state.isAuthenticated = true;

        state.user = mapUserInfoToUser(response.data.userInfo, {
          roles: ['User'],
          accountStatus: 'PendingVerification',
        });

        setErrorServiceContext(state.user, 'registered');
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.errorMessage = extractErrorMessage(action.payload);
      })

      // ============================================
      // TOKEN REFRESH
      // ============================================
      .addCase(refreshToken.pending, (state) => {
        // Don't set isLoading for silent refresh
        state.errorMessage = undefined;
      })
      .addCase(refreshToken.fulfilled, (state) => {
        state.isLoading = false;
        state.errorMessage = undefined;
        state.isAuthenticated = true;
        // User data is preserved during refresh
      })
      .addCase(refreshToken.rejected, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = undefined;
        // Don't set error for silent refresh failure
      })

      // ============================================
      // GET PROFILE
      // ============================================
      .addCase(getProfile.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.errorMessage = undefined;
        const profileData = action.payload.data;

        // Merge with existing user data to preserve fields not in profile response
        state.user = {
          ...state.user,
          id: profileData.userId,
          ...profileData,
        } as User;
      })
      .addCase(getProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.errorMessage = extractErrorMessage(action.payload);
      })

      // ============================================
      // UPDATE PROFILE
      // ============================================
      .addCase(updateProfile.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.errorMessage = undefined;
        const updateData = action.payload.data;

        state.user = {
          id: updateData.userId,
          favoriteSkills: state.user?.favoriteSkills ?? [],
          ...updateData,
        } as User;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.errorMessage = extractErrorMessage(action.payload);
      })

      // ============================================
      // UPLOAD PROFILE PICTURE
      // ============================================
      .addCase(uploadProfilePicture.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(uploadProfilePicture.fulfilled, (state, action) => {
        state.isLoading = false;
        state.errorMessage = undefined;
        state.user = action.payload.data;
      })
      .addCase(uploadProfilePicture.rejected, (state, action) => {
        state.isLoading = false;
        state.errorMessage = extractErrorMessage(action.payload);
      })

      // ============================================
      // CHANGE PASSWORD
      // ============================================
      .addCase(changePassword.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.isLoading = false;
        state.errorMessage = undefined;
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.isLoading = false;
        state.errorMessage = extractErrorMessage(action.payload);
      })

      // ============================================
      // SILENT LOGIN
      // ============================================
      .addCase(silentLogin.pending, () => {
        // Don't show loading for silent login
      })
      .addCase(silentLogin.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
        state.errorMessage = undefined;
      })
      .addCase(silentLogin.rejected, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = undefined;
        // Don't set error for silent login - it's expected to fail sometimes
      })

      // ============================================
      // LOGOUT
      // ============================================
      .addCase(logout.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logout.fulfilled, (state) => {
        // Clear error service context
        errorService.setUserContext('', '', '');
        errorService.clearBreadcrumbs();
        errorService.addBreadcrumb('User logged out', 'auth');

        // Reset state
        state.user = undefined;
        state.isAuthenticated = false;
        state.isLoading = false;
        state.errorMessage = undefined;
        state.pendingLoginCredentials = undefined;

        // Clear tokens
        removeToken();
      })
      .addCase(logout.rejected, (state) => {
        // Still clear state even if server logout fails
        state.user = undefined;
        state.isAuthenticated = false;
        state.isLoading = false;
        state.pendingLoginCredentials = undefined;
        removeToken();
      })

      // ============================================
      // EMAIL VERIFICATION
      // ============================================
      .addCase(verifyEmail.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(verifyEmail.fulfilled, (state) => {
        state.isLoading = false;
        state.errorMessage = undefined;
        if (state.user) {
          state.user.emailVerified = true;
        }
      })
      .addCase(verifyEmail.rejected, (state, action) => {
        state.isLoading = false;
        state.errorMessage = extractErrorMessage(action.payload);
      })

      // ============================================
      // 2FA - GENERATE SECRET
      // ============================================
      .addCase(generateTwoFactorSecret.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(generateTwoFactorSecret.fulfilled, (state) => {
        state.isLoading = false;
        state.errorMessage = undefined;
      })
      .addCase(generateTwoFactorSecret.rejected, (state, action) => {
        state.isLoading = false;
        state.errorMessage = extractErrorMessage(action.payload);
      })

      // ============================================
      // 2FA - VERIFY CODE
      // ============================================
      .addCase(verifyTwoFactorCode.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(verifyTwoFactorCode.fulfilled, (state) => {
        state.isLoading = false;
        state.errorMessage = undefined;
        state.pendingLoginCredentials = undefined;

        // Update user 2FA status
        if (state.user) {
          state.user.twoFactorEnabled = true;
        }
      })
      .addCase(verifyTwoFactorCode.rejected, (state, action) => {
        state.isLoading = false;
        state.errorMessage = extractErrorMessage(action.payload);
      })

      // ============================================
      // 2FA - GET STATUS
      // ============================================
      .addCase(getTwoFactorStatus.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getTwoFactorStatus.fulfilled, (state) => {
        state.isLoading = false;
        state.errorMessage = undefined;
      })
      .addCase(getTwoFactorStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.errorMessage = extractErrorMessage(action.payload);
      })

      // ============================================
      // 2FA - DISABLE
      // ============================================
      .addCase(disableTwoFactor.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(disableTwoFactor.fulfilled, (state) => {
        state.isLoading = false;
        state.errorMessage = undefined;

        if (state.user) {
          state.user.twoFactorEnabled = false;
        }
      })
      .addCase(disableTwoFactor.rejected, (state, action) => {
        state.isLoading = false;
        state.errorMessage = extractErrorMessage(action.payload);
      });
  },
});

export const {
  clearError,
  setError,
  setLoading,
  clearTwoFactorState,
  updateUserPartial,
  resetAuthState,
} = authSlice.actions;

export default authSlice.reducer;

// ============================================
// TYPE EXPORTS
// ============================================

export type AuthState = UsersEntityState;
