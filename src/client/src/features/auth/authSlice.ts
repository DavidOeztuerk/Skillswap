// src/features/auth/authSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import authService from '../../api/services/authService';
import {
  removeToken,
  getToken,
  getRefreshToken,
} from '../../utils/authHelpers';
import { AuthState } from '../../types/states/AuthState';
import { SliceError, createSliceError } from '../../store/types';
import { LoginRequest } from '../../types/contracts/requests/LoginRequest';
import { RegisterRequest } from '../../types/contracts/requests/RegisterRequest';
import { UpdateProfileRequest } from '../../types/contracts/requests/UpdateProfileRequest';
import { ChangePasswordRequest } from '../../types/contracts/requests/ChangePasswordRequest';
import { User } from '../../types/models/User';
import { VerifyTwoFactorCodeRequest } from '../../types/contracts/requests/VerifyTwoFactorCodeRequest';

// Extended interfaces for enhanced functionality
interface ExtendedLoginRequest extends LoginRequest {
  rememberMe?: boolean;
}

interface SilentLoginPayload {
  user: User;
  wasTokenRefreshed: boolean;
}

// Initial state with comprehensive error tracking
const initialState: AuthState = {
  user: null,
  token: getToken(),
  refreshToken: getRefreshToken(),
  isAuthenticated: !!getToken(),
  isLoading: false,
  error: null,
};

/**
 * Enhanced login async thunk with comprehensive error handling
 */
export const login = createAsyncThunk(
  'auth/login',
  async (credentials: ExtendedLoginRequest, { rejectWithValue }) => {
    try {
      const response = await authService.login(credentials);
      return response;
    } catch (error) {
      console.error('Login thunk error:', error);
      return rejectWithValue(
        createSliceError(
          error instanceof Error ? error.message : 'Login failed',
          error instanceof Error && 'code' in error ? (error as any).code : 'LOGIN_ERROR'
        )
      );
    }
  }
);

/**
 * Enhanced registration async thunk
 */
export const register = createAsyncThunk(
  'auth/register',
  async (userData: RegisterRequest, { rejectWithValue }) => {
    try {
      const response = await authService.register(userData);
      return response;
    } catch (error) {
      console.error('Registration thunk error:', error);
      return rejectWithValue(
        createSliceError(
          error instanceof Error ? error.message : 'Registration failed',
          error instanceof Error && 'code' in error ? (error as any).code : 'REGISTRATION_ERROR'
        )
      );
    }
  }
);

/**
 * Token refresh async thunk
 */
export const refreshToken = createAsyncThunk(
  'auth/refreshToken',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authService.refreshToken();

      if (!response) {
        throw new Error('Token refresh failed');
      }

      return response;
    } catch (error) {
      console.error('Token refresh thunk error:', error);
      return rejectWithValue(
        error instanceof Error ? error.message : 'Token refresh failed'
      );
    }
  }
);

/**
 * Get user profile async thunk
 */
export const getProfile = createAsyncThunk(
  'auth/getProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authService.getProfile();
      return response;
    } catch (error) {
      console.error('Get profile thunk error:', error);
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : 'Profile could not be loaded'
      );
    }
  }
);

/**
 * Update profile async thunk
 */
export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (profileData: UpdateProfileRequest, { rejectWithValue }) => {
    try {
      const response = await authService.updateProfile(profileData);
      return response;
    } catch (error) {
      console.error('Update profile thunk error:', error);
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : 'Profile could not be updated'
      );
    }
  }
);

/**
 * Upload profile picture async thunk
 */
export const uploadProfilePicture = createAsyncThunk(
  'auth/uploadProfilePicture',
  async (file: File, { rejectWithValue }) => {
    try {
      const response = await authService.uploadProfilePicture(file);
      return response;
    } catch (error) {
      console.error('Upload profile picture thunk error:', error);
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : 'Profile picture could not be uploaded'
      );
    }
  }
);

/**
 * Change password async thunk
 */
export const changePassword = createAsyncThunk(
  'auth/changePassword',
  async (passwordData: ChangePasswordRequest, { rejectWithValue }) => {
    try {
      await authService.changePassword(passwordData);
      return true;
    } catch (error) {
      console.error('Change password thunk error:', error);
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : 'Password could not be changed'
      );
    }
  }
);

/**
 * Silent login async thunk for app initialization
 */
export const silentLogin = createAsyncThunk(
  'auth/silentLogin',
  async (_, { rejectWithValue }) => {
    try {
      const user = await authService.silentLogin();

      if (!user) {
        throw new Error('Silent login failed');
      }

      return {
        user,
        wasTokenRefreshed: false, // Could be enhanced to track if token was refreshed
      } as SilentLoginPayload;
    } catch (error) {
      console.error('Silent login thunk error:', error);
      return rejectWithValue(
        error instanceof Error ? error.message : 'Silent login failed'
      );
    }
  }
);

/**
 * Logout async thunk
 */
export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { dispatch }) => {
    try {
      await authService.logout();

      // Clear any other state if needed
      dispatch(clearError());

      return null;
    } catch (error) {
      console.error('Logout thunk error:', error);
      // Even if logout fails, clear local state
      return null;
    }
  }
);

/**
 * Verify email async thunk
 */
import { VerifyEmailRequest } from '../../types/contracts/requests/VerifyEmailRequest';

export const verifyEmail = createAsyncThunk(
  'auth/verifyEmail',
  async (request: VerifyEmailRequest, { rejectWithValue }) => {
    try {
      await authService.verifyEmail(request);
      return true;
    } catch (error) {
      console.error('Email verification thunk error:', error);
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : 'Email verification failed'
      );
    }
  }
);
// 2FA: Generate secret
export const generateTwoFactorSecret = createAsyncThunk(
  'auth/generateTwoFactorSecret',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authService.generateTwoFactorSecret();
      return response;
    } catch (error) {
      console.error('2FA secret generation thunk error:', error);
      return rejectWithValue(
        error instanceof Error ? error.message : '2FA secret could not be generated'
      );
    }
  }
);

// 2FA: Verify code

export const verifyTwoFactorCode = createAsyncThunk(
  'auth/verifyTwoFactorCode',
  async (request: VerifyTwoFactorCodeRequest, { rejectWithValue }) => {
    try {
      const response = await authService.verifyTwoFactorCode(request);
      return response;
    } catch (error) {
      console.error('2FA verification thunk error:', error);
      return rejectWithValue(
        error instanceof Error ? error.message : '2FA verification failed'
      );
    }
  }
);

/**
 * Password reset request async thunk
 */
export const requestPasswordReset = createAsyncThunk(
  'auth/requestPasswordReset',
  async (email: string, { rejectWithValue }) => {
    try {
      await authService.forgotPassword(email);
      return email;
    } catch (error) {
      console.error('Password reset request thunk error:', error);
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : 'Password reset request failed'
      );
    }
  }
);

/**
 * Reset password async thunk
 */
export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async (
    { token, password }: { token: string; password: string },
    { rejectWithValue }
  ) => {
    try {
      await authService.resetPassword(token, password);
      return true;
    } catch (error) {
      console.error('Password reset thunk error:', error);
      return rejectWithValue(
        error instanceof Error ? error.message : 'Password reset failed'
      );
    }
  }
);

/**
 * Perfect Auth Slice with comprehensive state management
 */
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    /**
     * Clear error state
     */
    clearError: (state) => {
      state.error = null;
    },

    /**
     * Update user data manually
     */
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },

    /**
     * Set loading state manually
     */
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    /**
     * Force logout (for emergency cleanup)
     */
    forceLogout: (state) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = null;
      removeToken();
    },

    /**
     * Set authentication state manually (for testing/debugging)
     */
    setAuthState: (state, action: PayloadAction<Partial<AuthState>>) => {
      Object.assign(state, action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      // Login cases
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.profile || null;
        state.token = action.payload.tokens.accessToken;
        state.refreshToken = action.payload.tokens.refreshToken;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.error = action.payload as SliceError;
      })

      // Registration cases
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = {
          id: action.payload.userId,
          email: action.payload.email,
          firstName: action.payload.firstName,
          lastName: action.payload.lastName,
          userName: action.payload.userName,
          roles: [],
          emailVerified: false,
          accountStatus: '',
          createdAt: '',
        };
        state.token = action.payload.tokens.accessToken;
        state.refreshToken = action.payload.tokens.refreshToken;
        state.error = null;
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.error = action.payload as SliceError;
      })

      // Refresh token cases
      .addCase(refreshToken.pending, (state) => {
        // Don't set loading for refresh - should be transparent
        state.error = null;
      })
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(refreshToken.rejected, (state, action) => {
        // On refresh failure, logout user
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.error = action.payload as SliceError;
      })

      // Get profile cases
      .addCase(getProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(getProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as SliceError;
      })

      // Update profile cases
      .addCase(updateProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as SliceError;
      })

      // Upload profile picture cases
      .addCase(uploadProfilePicture.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(uploadProfilePicture.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(uploadProfilePicture.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as SliceError;
      })

      // Change password cases
      .addCase(changePassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as SliceError;
      })

      // Silent login cases
      .addCase(silentLogin.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(silentLogin.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.error = null;
      })
      .addCase(silentLogin.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.error = action.payload as SliceError;
      })

      // Logout cases
      .addCase(logout.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        state.isLoading = false;
        state.error = null;
      })
      .addCase(logout.rejected, (state) => {
        // Even if logout fails, clear state
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        state.isLoading = false;
        state.error = null;
      })

      // Email verification cases
      .addCase(verifyEmail.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyEmail.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
        // Could update user.emailVerified = true if that field exists
      })
      .addCase(verifyEmail.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as SliceError;
      })

      // Password reset request cases
      .addCase(requestPasswordReset.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(requestPasswordReset.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(requestPasswordReset.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as SliceError;
      })

      // Reset password cases
      .addCase(resetPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as SliceError;
      });
  },
});

export const { clearError, updateUser, setLoading, forceLogout, setAuthState } =
  authSlice.actions;

export default authSlice.reducer;
