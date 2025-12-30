import { createAsyncThunk } from '@reduxjs/toolkit';
import { createAppAsyncThunk } from '../../../core/store/thunkHelpers';
import { isSuccessResponse } from '../../../shared/types/api/UnifiedResponse';
import authService from '../services/authService';
import type { UpdateProfileRequest } from '../../user/types/UpdateProfileRequest';
import type { ChangePasswordRequest } from '../types/ChangePasswordRequest';
import type { DisableTwoFactorRequest } from '../types/DisableTwoFactorRequest';
import type { LoginRequest } from '../types/LoginRequest';
import type { RegisterRequest } from '../types/RegisterRequest';
import type { VerifyEmailRequest } from '../types/VerifyEmailRequest';
import type { VerifyTwoFactorCodeRequest } from '../types/VerifyTwoFactorCodeRequest';

export const login = createAppAsyncThunk(
  'auth/login',
  async (credentials: LoginRequest, { rejectWithValue }) => {
    const response = await authService.login(credentials);
    return isSuccessResponse(response) ? response : rejectWithValue(response);
  }
);

export const register = createAppAsyncThunk(
  'auth/register',
  async (credentials: RegisterRequest, { rejectWithValue }) => {
    const response = await authService.register(credentials);
    return isSuccessResponse(response) ? response : rejectWithValue(response);
  }
);

export const refreshToken = createAppAsyncThunk(
  'auth/refreshToken',
  async (_, { rejectWithValue }) => {
    const response = await authService.refreshToken();
    return isSuccessResponse(response) ? response : rejectWithValue(response);
  }
);

export const getProfile = createAppAsyncThunk('auth/getProfile', async (_, { rejectWithValue }) => {
  const response = await authService.getProfile();
  return isSuccessResponse(response) ? response : rejectWithValue(response);
});

export const updateProfile = createAppAsyncThunk(
  'auth/updateProfile',
  async (profileData: UpdateProfileRequest, { rejectWithValue }) => {
    const response = await authService.updateProfile(profileData);
    return isSuccessResponse(response) ? response : rejectWithValue(response);
  }
);

export const uploadProfilePicture = createAppAsyncThunk(
  'auth/uploadProfilePicture',
  async (file: File, { rejectWithValue }) => {
    const response = await authService.uploadProfilePicture(file);
    return isSuccessResponse(response) ? response : rejectWithValue(response);
  }
);

export const changePassword = createAppAsyncThunk(
  'auth/changePassword',
  async (passwordData: ChangePasswordRequest, { rejectWithValue }) => {
    const response = await authService.changePassword(passwordData);
    return isSuccessResponse(response) ? response : rejectWithValue(response);
  }
);

export const silentLogin = createAppAsyncThunk(
  'auth/silentLogin',
  async (_, { rejectWithValue }) => {
    const user = await authService.silentLogin();
    if (user) return user;
    return rejectWithValue({
      errors: ['Silent login failed'],
      message: 'Silent login failed',
      errorCode: 'SILENT_LOGIN_FAILED',
      success: false,
    });
  }
);

export const logout = createAsyncThunk('auth/logout', async () => {
  await authService.logout();
});

export const verifyEmail = createAppAsyncThunk(
  'auth/verifyEmail',
  async (request: VerifyEmailRequest, { rejectWithValue }) => {
    const response = await authService.verifyEmail(request);
    return isSuccessResponse(response) ? response : rejectWithValue(response);
  }
);

export const generateTwoFactorSecret = createAppAsyncThunk(
  'auth/generateTwoFactorSecret',
  async (_, { rejectWithValue }) => {
    const response = await authService.generateTwoFactorSecret();
    return isSuccessResponse(response) ? response : rejectWithValue(response);
  }
);

export const verifyTwoFactorCode = createAppAsyncThunk(
  'auth/verifyTwoFactorCode',
  async (request: VerifyTwoFactorCodeRequest, { rejectWithValue }) => {
    const response = await authService.verifyTwoFactorCode(request);
    return isSuccessResponse(response) ? response : rejectWithValue(response);
  }
);

export const getTwoFactorStatus = createAppAsyncThunk(
  'auth/getTwoFactorStatus',
  async (_, { rejectWithValue }) => {
    const response = await authService.getTwoFactorStatus();
    return isSuccessResponse(response) ? response : rejectWithValue(response);
  }
);

export const disableTwoFactor = createAppAsyncThunk(
  'auth/disableTwoFactor',
  async (request: DisableTwoFactorRequest, { rejectWithValue }) => {
    const response = await authService.disableTwoFactor(request);
    return isSuccessResponse(response) ? response : rejectWithValue(response);
  }
);

export const requestPasswordReset = createAppAsyncThunk(
  'auth/requestPasswordReset',
  async (email: string, { rejectWithValue }) => {
    const response = await authService.forgotPassword(email);
    return isSuccessResponse(response) ? response : rejectWithValue(response);
  }
);

export const resetPassword = createAppAsyncThunk(
  'auth/resetPassword',
  async (
    {
      email,
      token,
      newPassword,
      confirmPassword,
    }: { email: string; token: string; newPassword: string; confirmPassword: string },
    { rejectWithValue }
  ) => {
    const response = await authService.resetPassword(email, token, newPassword, confirmPassword);
    return isSuccessResponse(response) ? response : rejectWithValue(response);
  }
);
