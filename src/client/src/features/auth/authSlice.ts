// src/features/auth/authSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import authService from '../../api/services/authService';
import {
  removeToken,
  getToken,
  getRefreshToken,
} from '../../utils/authHelpers';
import { AuthState } from '../../types/states/AuthState';
import { LoginRequest } from '../../types/contracts/requests/LoginRequest';
import { RegisterRequest } from '../../types/contracts/requests/RegisterRequest';
import { UpdateProfileRequest } from '../../types/contracts/requests/UpdateProfileRequest';
import { ChangePasswordRequest } from '../../types/contracts/requests/ChangePasswordRequest';
import { User } from '../../types/models/User';

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
  error: undefined,
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
        error instanceof Error ? error.message : 'Login fehlgeschlagen'
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
        error instanceof Error ? error.message : 'Registrierung fehlgeschlagen'
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
        throw new Error('Token-Refresh fehlgeschlagen');
      }

      return response;
    } catch (error) {
      console.error('Token refresh thunk error:', error);
      return rejectWithValue(
        error instanceof Error ? error.message : 'Token-Refresh fehlgeschlagen'
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
          : 'Profil konnte nicht geladen werden'
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
          : 'Profil konnte nicht aktualisiert werden'
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
          : 'Profilbild konnte nicht hochgeladen werden'
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
          : 'Passwort konnte nicht geändert werden'
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
        throw new Error('Silent login fehlgeschlagen');
      }

      return {
        user,
        wasTokenRefreshed: false, // Could be enhanced to track if token was refreshed
      } as SilentLoginPayload;
    } catch (error) {
      console.error('Silent login thunk error:', error);
      return rejectWithValue(
        error instanceof Error ? error.message : 'Silent login fehlgeschlagen'
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
export const verifyEmail = createAsyncThunk(
  'auth/verifyEmail',
  async (token: string, { rejectWithValue }) => {
    try {
      await authService.verifyEmail(token);
      return true;
    } catch (error) {
      console.error('Email verification thunk error:', error);
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : 'E-Mail-Verifizierung fehlgeschlagen'
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
          : 'Passwort-Reset-Anfrage fehlgeschlagen'
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
        error instanceof Error ? error.message : 'Passwort-Reset fehlgeschlagen'
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
      state.error = undefined;
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
      state.error = undefined;
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
        state.error = undefined;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.profile || null;
        state.token = action.payload.tokens.accessToken;
        state.refreshToken = action.payload.tokens.refreshToken;
        state.error = undefined;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.error = action.payload as string;
      })

      // Registration cases
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = undefined;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = {
          id: action.payload.userId,
          email: action.payload.email,
          firstName: action.payload.firstName,
          lastName: action.payload.lastName,
          userName : action.payload.userName,
          token: action.payload.tokens.accessToken,
        };
        state.token = action.payload.tokens.accessToken;
        state.refreshToken = action.payload.tokens.refreshToken;
        state.error = undefined;
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.error = action.payload as string;
      })

      // Refresh token cases
      .addCase(refreshToken.pending, (state) => {
        // Don't set loading for refresh - should be transparent
        state.error = undefined;
      })
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
        state.isAuthenticated = true;
        state.error = undefined;
      })
      .addCase(refreshToken.rejected, (state, action) => {
        // On refresh failure, logout user
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.error = action.payload as string;
      })

      // Get profile cases
      .addCase(getProfile.pending, (state) => {
        state.isLoading = true;
        state.error = undefined;
      })
      .addCase(getProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.error = undefined;
      })
      .addCase(getProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Update profile cases
      .addCase(updateProfile.pending, (state) => {
        state.isLoading = true;
        state.error = undefined;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.error = undefined;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Upload profile picture cases
      .addCase(uploadProfilePicture.pending, (state) => {
        state.isLoading = true;
        state.error = undefined;
      })
      .addCase(uploadProfilePicture.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.error = undefined;
      })
      .addCase(uploadProfilePicture.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Change password cases
      .addCase(changePassword.pending, (state) => {
        state.isLoading = true;
        state.error = undefined;
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.isLoading = false;
        state.error = undefined;
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Silent login cases
      .addCase(silentLogin.pending, (state) => {
        state.isLoading = true;
        state.error = undefined;
      })
      .addCase(silentLogin.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.error = undefined;
      })
      .addCase(silentLogin.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.error = action.payload as string;
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
        state.error = undefined;
      })
      .addCase(logout.rejected, (state) => {
        // Even if logout fails, clear state
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        state.isLoading = false;
        state.error = undefined;
      })

      // Email verification cases
      .addCase(verifyEmail.pending, (state) => {
        state.isLoading = true;
        state.error = undefined;
      })
      .addCase(verifyEmail.fulfilled, (state) => {
        state.isLoading = false;
        state.error = undefined;
        // Could update user.emailVerified = true if that field exists
      })
      .addCase(verifyEmail.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Password reset request cases
      .addCase(requestPasswordReset.pending, (state) => {
        state.isLoading = true;
        state.error = undefined;
      })
      .addCase(requestPasswordReset.fulfilled, (state) => {
        state.isLoading = false;
        state.error = undefined;
      })
      .addCase(requestPasswordReset.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Reset password cases
      .addCase(resetPassword.pending, (state) => {
        state.isLoading = true;
        state.error = undefined;
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.isLoading = false;
        state.error = undefined;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, updateUser, setLoading, forceLogout, setAuthState } =
  authSlice.actions;

export default authSlice.reducer;
