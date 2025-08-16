import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import authService from '../../api/services/authService';
import { removeToken, getToken, getRefreshToken } from '../../utils/authHelpers';
import { AuthState } from '../../types/states/AuthState';
import { LoginRequest } from '../../types/contracts/requests/LoginRequest';
import { RegisterRequest } from '../../types/contracts/requests/RegisterRequest';
import { UpdateProfileRequest } from '../../types/contracts/requests/UpdateProfileRequest';
import { ChangePasswordRequest } from '../../types/contracts/requests/ChangePasswordRequest';
import { VerifyEmailRequest } from '../../types/contracts/requests/VerifyEmailRequest';
import { VerifyTwoFactorCodeRequest } from '../../types/contracts/requests/VerifyTwoFactorCodeRequest';
import { DisableTwoFactorRequest } from '../../types/contracts/requests/DisableTwoFactorRequest';
import { SliceError } from '../../store/types';
import { withDefault, isDefined } from '../../utils/safeAccess';
import errorService from '../../services/errorService';

// Helper to create standardized error
const createStandardError = (error: any): SliceError => ({
  message: error?.message || error?.data?.message || 'Ein unbekannter Fehler ist aufgetreten',
  code: error?.status || error?.code || 'UNKNOWN_ERROR',
  details: error?.data || error
});

const initialState: AuthState = {
  user: null,
  token: getToken(),
  refreshToken: getRefreshToken(),
  isAuthenticated: !!getToken(),
  isLoading: false,
  error: null,
  twoFactorRequired: false,
  twoFactorEnabled: false,
  pendingLoginCredentials: null,
};

// Async thunks
export const login = createAsyncThunk(
  'auth/login',
  async (credentials: LoginRequest) => {
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
    return await authService.refreshToken();
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
    return await authService.changePassword(passwordData);
  }
);

export const silentLogin = createAsyncThunk(
  'auth/silentLogin',
  async () => {
    return await authService.silentLogin();
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
    return await authService.verifyEmail(request);
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

export const getTwoFactorStatus = createAsyncThunk(
  'auth/getTwoFactorStatus',
  async () => {
    return await authService.getTwoFactorStatus();
  }
);

export const disableTwoFactor = createAsyncThunk(
  'auth/disableTwoFactor',
  async (request: DisableTwoFactorRequest) => {
    return await authService.disableTwoFactor(request);
  }
);

export const requestPasswordReset = createAsyncThunk(
  'auth/requestPasswordReset',
  async (email: string) => {
    return await authService.forgotPassword(email);;
  }
);

export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async ({ token, password }: { token: string; password: string }) => {
    return  await authService.resetPassword(token, password);;
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
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    clearTwoFactorState: (state) => {
      state.twoFactorRequired = false;
      state.pendingLoginCredentials = null;
    },
    forceLogout: (state) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = null;
      state.twoFactorRequired = false;
      state.twoFactorEnabled = false;
      state.pendingLoginCredentials = null;
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
        let response = action.payload;
        state.isLoading = false;

        // Check if 2FA is required
        if (response.data?.requires2FA) {
          state.twoFactorRequired = true;
          state.pendingLoginCredentials = action.meta.arg;
          state.isAuthenticated = false;
          return;
        }
        
        state.isAuthenticated = true;
        state.twoFactorRequired = response.data?.requires2FA;
        state.pendingLoginCredentials = null;
        
        // Handle both nested user object and flat response with safe access
        const userData = response.data?.userInfo;
        state.user = isDefined(userData) ? {
          id: withDefault(userData.userId, ''),
          email: withDefault(userData.email, ''),
          firstName: withDefault(userData.firstName, ''),
          lastName: withDefault(userData.lastName, ''),
          userName: withDefault(userData.userName, ''),
          roles: withDefault(userData.roles, []),
          favoriteSkills: userData.favoriteSkills,
          emailVerified: withDefault(userData.emailVerified, false),
          accountStatus: withDefault(userData.accountStatus, 'active'),
        } : null;
        
        state.token = response.data?.accessToken;
        state.refreshToken = response.data?.refreshToken;
        state.error = null;
        
        // Set user context for error tracking
        if (state.user) {
          errorService.setUserContext(state.user.id, state.user.email, state.user.userName);
          errorService.addBreadcrumb('User logged in', 'auth', { 
            userId: state.user.id,
            method: 'standard'
          });
        }
        
        // Store permissions in localStorage if available
        if (response.data?.permissions) {
          localStorage.setItem('userPermissions', JSON.stringify({
            ...response.data.permissions,
            timestamp: Date.now()
          }));
          console.log('💾 Permissions stored from login response');
        }
        
        console.log('✅ Login successful in authSlice, token set:', action.payload.data?.accessToken ? 'Yes' : 'No');
        console.log('🔍 AuthSlice received response:', {
          hasAccessToken: !!action.payload.data?.accessToken,
          hasRefreshToken: !!action.payload.data?.refreshToken,
          hasUser: !!action.payload.data?.userInfo,
          hasPermissions: !!action.payload.data?.permissions,
          userRoles: userData?.roles,
          permissionCount: action.payload.data?.permissions?.permissionNames?.length
        });
        console.log('👤 User Roles after login:', userData?.roles);
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
        const response = action.payload;
        
        // Check if registration was successful
        if (!response.success || !response.data) {
          state.error = { 
            message: response.message || 'Registration failed', 
            code: 'REGISTRATION_FAILED', 
            details: undefined
          };
          return;
        }
        
        const registerData = response.data;
        state.isAuthenticated = true;
        
        // Use UserInfo from response - same structure as login
        const userData = registerData.userInfo;
        state.user = isDefined(userData) ? {
          id: withDefault(userData.userId, ''),
          email: withDefault(userData.email, ''),
          firstName: withDefault(userData.firstName, ''),
          lastName: withDefault(userData.lastName, ''),
          userName: withDefault(userData.userName, ''),
          roles: withDefault(userData.roles, ['User']), 
          favoriteSkills: userData.favoriteSkills,
          emailVerified: withDefault(userData.emailVerified, false),
          accountStatus: withDefault(userData.accountStatus, 'PendingVerification'),
        } : null;
        
        state.token = registerData?.accessToken || null;
        state.refreshToken = registerData?.refreshToken || null;
        state.error = null;
        
        // Set user context for error tracking
        if (state.user) {
          errorService.setUserContext(state.user.id, state.user.email, state.user.userName);
          errorService.addBreadcrumb('User registered', 'auth', { 
            userId: state.user.id,
            method: 'registration'
          });
        }
        
        // Store permissions in localStorage if available
        if (registerData?.permissions) {
          localStorage.setItem('userPermissions', JSON.stringify({
            ...registerData.permissions,
            timestamp: Date.now()
          }));
          console.log('💾 Permissions stored from register response');
        }
        
        console.log('✅ Registration successful in authSlice:', {
          hasAccessToken: !!registerData?.accessToken,
          hasRefreshToken: !!registerData?.refreshToken,
          hasUserInfo: !!registerData?.userInfo,
          hasPermissions: !!registerData?.permissions,
          userRoles: userData?.roles,
          permissionCount: registerData?.permissions?.permissionNames?.length
        });
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
        state.token = action.payload?.accessToken || null;
        state.refreshToken = action.payload?.refreshToken || null;
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
        
        // Check if profile fetch was successful
        if (!action.payload.success || !action.payload.data) {
          state.error = { 
            message: action.payload.message || 'Failed to fetch profile', 
            code: 'PROFILE_FETCH_FAILED', 
            details: undefined
          };
          return;
        }
        
        const profileData = action.payload.data;
        state.user = {...profileData, id: profileData.userId }; 
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
        
        // Check if profile update was successful
        if (!action.payload.success || !action.payload.data) {
          state.error = { 
            message: action.payload.message || 'Failed to update profile', 
            code: 'PROFILE_UPDATE_FAILED', 
            details: undefined
          };
          return;
        }
        
        const updateData = action.payload.data;
        state.user = { 
          id: updateData.userId, 
          favoriteSkills: state.user?.favoriteSkills ?? [],
          ...updateData};
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
        // Clear error tracking context
        errorService.setUserContext('', '', '');
        errorService.clearBreadcrumbs();
        errorService.addBreadcrumb('User logged out', 'auth');
        
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
      })
      
      // Generate 2FA Secret
      .addCase(generateTwoFactorSecret.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(generateTwoFactorSecret.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(generateTwoFactorSecret.rejected, (state, action) => {
        state.isLoading = false;
        state.error = createStandardError(action.error);
      })
      
      // Verify 2FA Code
      .addCase(verifyTwoFactorCode.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyTwoFactorCode.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload.success) {
          state.twoFactorEnabled = true;
        }
        state.error = null;
      })
      .addCase(verifyTwoFactorCode.rejected, (state, action) => {
        state.isLoading = false;
        state.error = createStandardError(action.error);
      })
      
      // Get 2FA Status
      .addCase(getTwoFactorStatus.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getTwoFactorStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload.success && action.payload.data) {
          state.twoFactorEnabled = action.payload.data.isEnabled || false;
        }
        state.error = null;
      })
      .addCase(getTwoFactorStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.error = createStandardError(action.error);
      })
      
      // Disable 2FA
      .addCase(disableTwoFactor.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(disableTwoFactor.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload.success) {
          state.twoFactorEnabled = false;
        }
        state.error = null;
      })
      .addCase(disableTwoFactor.rejected, (state, action) => {
        state.isLoading = false;
        state.error = createStandardError(action.error);
      });
  },
});

export const { clearError, setLoading, forceLogout, clearTwoFactorState } = authSlice.actions;
export default authSlice.reducer;