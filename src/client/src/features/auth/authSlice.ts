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
import { User } from '../../types/models/User';

// Initialer State für den Auth-Reducer
const initialState: AuthState = {
  user: null,
  token: getToken(),
  refreshToken: getRefreshToken(),
  isAuthenticated: !!getToken(),
  isLoading: false,
  error: undefined,
};

// Async Thunk für Login
export const login = createAsyncThunk(
  'auth/login',
  async (
    credentials: LoginRequest & { rememberMe: boolean | undefined },
    { rejectWithValue }
  ) => {
    try {
      const response = await authService.login(credentials);
      return response;
      // if (response.success && response.data) {

      //   return response.data;
      // }
      // return rejectWithValue(response.message || 'Login fehlgeschlagen');
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Login fehlgeschlagen'
      );
    }
  }
);

// Neuer Async Thunk für Token-Refresh
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
      return rejectWithValue(
        error instanceof Error ? error.message : 'Token-Refresh fehlgeschlagen'
      );
    }
  }
);

// Async Thunk für Registrierung
export const register = createAsyncThunk(
  'auth/register',
  async (userData: RegisterRequest, { rejectWithValue }) => {
    try {
      const response = await authService.register(userData);
      return response;
      // if (response.success && response.data) {

      // }
      // return rejectWithValue(
      //   response.message || 'Registrierung fehlgeschlagen'
      // );
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Registrierung fehlgeschlagen'
      );
    }
  }
);

// Async Thunk für Profil laden
export const getProfile = createAsyncThunk(
  'auth/getProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authService.getProfile();
      return response;
      // if (response.success && response.data) {
      //   return response.data;
      // }
      // return rejectWithValue(
      //   response.message || 'Profil konnte nicht geladen werden'
      // );
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : 'Profil konnte nicht geladen werden'
      );
    }
  }
);

// Async Thunk für Profil aktualisieren
export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (profileData: UpdateProfileRequest, { rejectWithValue }) => {
    try {
      const response = await authService.updateProfile(profileData);
      return response;
      // if (response.success && response.data) {
      //   return response.data;
      // }
      // return rejectWithValue(
      //   response.message || 'Profil konnte nicht aktualisiert werden'
      // );
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : 'Profil konnte nicht aktualisiert werden'
      );
    }
  }
);

// Async Thunk für Passwort ändern
export const changePassword = createAsyncThunk(
  'auth/changePassword',
  async (
    {
      currentPassword,
      newPassword,
    }: { currentPassword: string; newPassword: string },
    { rejectWithValue }
  ) => {
    try {
      await authService.changePassword({
        currentPassword,
        newPassword,
        confirmNewPassword: newPassword,
      });
      // return response;
      // if (response.success) {
      //   return true;
      // }
      // return rejectWithValue(
      //   response.message || 'Passwort konnte nicht geändert werden'
      // );
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : 'Passwort konnte nicht geändert werden'
      );
    }
  }
);

// Async Thunk für Logout
export const logout = createAsyncThunk('auth/logout', async () => {
  await authService.logout();
  removeToken();
  return null;
});

// Auth Slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = undefined;
    },
    updateUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = undefined;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.token = action.payload.tokens.accessToken;
        state.refreshToken = action.payload.tokens.refreshToken;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // RefreshToken
      .addCase(refreshToken.pending, (state) => {
        state.isLoading = true;
        state.error = undefined;
      })
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.isLoading = false;
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
        state.isAuthenticated = true;
      })
      .addCase(refreshToken.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        // Bei einem Refresh-Fehler könnten wir den Benutzer abmelden
        state.isAuthenticated = false;
      })
      // Register
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = undefined;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        if (state.user) {
          state.user.email = action.payload.email;
          state.user.firstName = action.payload.firstName;
          state.user.lastName = action.payload.lastName;
        }
        state.token = action.payload.tokens.accessToken;
        state.refreshToken = action.payload.tokens.refreshToken;
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Get Profile
      .addCase(getProfile.pending, (state) => {
        state.isLoading = true;
        state.error = undefined;
      })
      .addCase(getProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
      })
      .addCase(getProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Update Profile
      .addCase(updateProfile.pending, (state) => {
        state.isLoading = true;
        state.error = undefined;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Change Password
      .addCase(changePassword.pending, (state) => {
        state.isLoading = true;
        state.error = undefined;
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
      });
  },
});

export const { clearError, updateUser } = authSlice.actions;
export default authSlice.reducer;
