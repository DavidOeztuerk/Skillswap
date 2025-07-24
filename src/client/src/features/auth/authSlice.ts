// src/features/auth/authSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import authService from '../../api/services/authService';
import { removeToken, getToken, getRefreshToken } from '../../utils/authHelpers';
import { AuthState } from '../../types/states/AuthState';
import { LoginRequest } from '../../types/contracts/requests/LoginRequest';
import { RegisterRequest } from '../../types/contracts/requests/RegisterRequest';
import { UpdateProfileRequest } from '../../types/contracts/requests/UpdateProfileRequest';
import { ChangePasswordRequest } from '../../types/contracts/requests/ChangePasswordRequest';
import { User } from '../../types/models/User';
import { VerifyEmailRequest } from '../../types/contracts/requests/VerifyEmailRequest';
import { VerifyTwoFactorCodeRequest } from '../../types/contracts/requests/VerifyTwoFactorCodeRequest';
import { SliceError } from '../../store/types';

// Helper to create standardized error
const createStandardError = (error: any): SliceError => ({
  message: error?.message || error?.data?.message || 'Ein unbekannter Fehler ist aufgetreten',
  code: error?.status || error?.code || 'UNKNOWN_ERROR',
  details: error?.data || error
});

interface ExtendedLoginRequest extends LoginRequest {
  rememberMe?: boolean;
}

const initialState: AuthState = {
  user: null,
  token: getToken(),
  refreshToken: getRefreshToken(),
  isAuthenticated: !!getToken(),
  isLoading: false,
  error: null,
};

// Async thunks
export const login = createAsyncThunk(
  'auth/login',
  async (credentials: ExtendedLoginRequest) => {
    return await authService.login(credentials);
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (userData: RegisterRequest) => {
    return await authService.register(userData);
  }
);

export const refreshToken = createAsyncThunk(
  'auth/refreshToken',
  async () => {
    const response = await authService.refreshToken();
    if (!response) throw new Error('Token-Aktualisierung fehlgeschlagen');
    return response;
  }
);

export const getProfile = createAsyncThunk(
  'auth/getProfile',
  async () => {
    return await authService.getProfile();
  }
);

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (profileData: UpdateProfileRequest) => {
    return await authService.updateProfile(profileData);
  }
);

export const uploadProfilePicture = createAsyncThunk(
  'auth/uploadProfilePicture',
  async (file: File) => {
    return await authService.uploadProfilePicture(file);
  }
);

export const changePassword = createAsyncThunk(
  'auth/changePassword',
  async (passwordData: ChangePasswordRequest) => {
    await authService.changePassword(passwordData);
    return true;
  }
);

export const silentLogin = createAsyncThunk(
  'auth/silentLogin',
  async () => {
    const user = await authService.silentLogin();
    if (!user) throw new Error('Automatische Anmeldung fehlgeschlagen');
    return user;
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async () => {
    await authService.logout();
  }
);

export const verifyEmail = createAsyncThunk(
  'auth/verifyEmail',
  async (request: VerifyEmailRequest) => {
    await authService.verifyEmail(request);
    return true;
  }
);

export const generateTwoFactorSecret = createAsyncThunk(
  'auth/generateTwoFactorSecret',
  async () => {
    return await authService.generateTwoFactorSecret();
  }
);

export const verifyTwoFactorCode = createAsyncThunk(
  'auth/verifyTwoFactorCode',
  async (request: VerifyTwoFactorCodeRequest) => {
    return await authService.verifyTwoFactorCode(request);
  }
);

export const requestPasswordReset = createAsyncThunk(
  'auth/requestPasswordReset',
  async (email: string) => {
    await authService.forgotPassword(email);
    return email;
  }
);

export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async ({ token, password }: { token: string; password: string }) => {
    await authService.resetPassword(token, password);
    return true;
  }
);

// Slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    forceLogout: (state) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = null;
      removeToken();
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        // state.user = action.payload || null;
        state.token = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.error = createStandardError(action.error)
      })

      // Register
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
        state.token = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.error = null;
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.error = createStandardError(action.error);
      })

      // Token Refresh
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.token = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.isAuthenticated = true;
      })
      .addCase(refreshToken.rejected, (state) => {
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.refreshToken = null;
      })

      // Get Profile
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
        state.error = createStandardError(action.error);
      })

      // Update Profile
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
        state.error = createStandardError(action.error);
      })

      // Upload Profile Picture
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
        state.error = createStandardError(action.error);
      })

      // Change Password
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
        state.error = createStandardError(action.error);
      })

      // Silent Login
      .addCase(silentLogin.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(silentLogin.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(silentLogin.rejected, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.refreshToken = null;
      })

      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        state.isLoading = false;
        state.error = null;
      })

      // Email Verification
      .addCase(verifyEmail.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyEmail.fulfilled, (state) => {
        state.isLoading = false;
        if (state.user) {
          state.user.emailVerified = true;
        }
        state.error = null;
      })
      .addCase(verifyEmail.rejected, (state, action) => {
        state.isLoading = false;
        state.error = createStandardError(action.error);
      })

      // Password Reset Request
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
        state.error = createStandardError(action.error);
      })

      // Reset Password
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
        state.error = createStandardError(action.error);
      });
  },
});

export const { clearError, updateUser, setLoading, forceLogout } = authSlice.actions;
export default authSlice.reducer;