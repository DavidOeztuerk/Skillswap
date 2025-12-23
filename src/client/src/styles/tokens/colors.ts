/**
 * Color Design Tokens
 *
 * Centralized color palette for the Skillswap application.
 * These tokens should be used throughout the app for consistency.
 */

// ============================================================================
// Brand Colors
// ============================================================================

export const brandColors = {
  primary: {
    50: '#e8f5e9',
    100: '#c8e6c9',
    200: '#a5d6a7',
    300: '#81c784',
    400: '#66bb6a',
    500: '#4caf50', // Main primary
    600: '#43a047',
    700: '#388e3c',
    800: '#2e7d32',
    900: '#1b5e20',
  },
  secondary: {
    50: '#fff3e0',
    100: '#ffe0b2',
    200: '#ffcc80',
    300: '#ffb74d',
    400: '#ffa726',
    500: '#ff9800', // Main secondary
    600: '#fb8c00',
    700: '#f57c00',
    800: '#ef6c00',
    900: '#e65100',
  },
} as const;

// ============================================================================
// Semantic Colors
// ============================================================================

export const semanticColors = {
  success: {
    light: '#81c784',
    main: '#4caf50',
    dark: '#388e3c',
    contrastText: '#ffffff',
  },
  error: {
    light: '#e57373',
    main: '#f44336',
    dark: '#d32f2f',
    contrastText: '#ffffff',
  },
  warning: {
    light: '#ffb74d',
    main: '#ff9800',
    dark: '#f57c00',
    contrastText: '#000000',
  },
  info: {
    light: '#64b5f6',
    main: '#2196f3',
    dark: '#1976d2',
    contrastText: '#ffffff',
  },
} as const;

// ============================================================================
// Neutral Colors
// ============================================================================

export const neutralColors = {
  grey: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#eeeeee',
    300: '#e0e0e0',
    400: '#bdbdbd',
    500: '#9e9e9e',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
  },
  white: '#ffffff',
  black: '#000000',
} as const;

// ============================================================================
// Background Colors
// ============================================================================

export const backgroundColors = {
  light: {
    default: '#f8f9fa',
    paper: '#ffffff',
    elevated: '#ffffff',
  },
  dark: {
    default: '#121212',
    paper: '#1e1e1e',
    elevated: '#2d2d2d',
  },
} as const;

// ============================================================================
// Text Colors
// ============================================================================

export const textColors = {
  light: {
    primary: 'rgba(0, 0, 0, 0.87)',
    secondary: 'rgba(0, 0, 0, 0.6)',
    disabled: 'rgba(0, 0, 0, 0.38)',
    hint: 'rgba(0, 0, 0, 0.38)',
  },
  dark: {
    primary: 'rgba(255, 255, 255, 0.87)',
    secondary: 'rgba(255, 255, 255, 0.6)',
    disabled: 'rgba(255, 255, 255, 0.38)',
    hint: 'rgba(255, 255, 255, 0.38)',
  },
} as const;

// ============================================================================
// Feature-Specific Colors
// ============================================================================

export const featureColors = {
  // Video Call
  videoCall: {
    controlsBackground: 'rgba(0, 0, 0, 0.7)',
    overlay: 'rgba(0, 0, 0, 0.5)',
    highlight: '#4caf50',
    endCall: '#f44336',
  },

  // Match Status
  matchStatus: {
    pending: '#ff9800',
    accepted: '#4caf50',
    declined: '#f44336',
    expired: '#9e9e9e',
    cancelled: '#757575',
  },

  // Appointment Status
  appointmentStatus: {
    scheduled: '#2196f3',
    confirmed: '#4caf50',
    inProgress: '#ff9800',
    completed: '#66bb6a',
    cancelled: '#f44336',
  },

  // Skill Proficiency
  skillProficiency: {
    beginner: '#81c784',
    intermediate: '#4caf50',
    advanced: '#388e3c',
    expert: '#1b5e20',
  },

  // Security/E2EE
  security: {
    encrypted: '#4caf50',
    unencrypted: '#f44336',
    verifying: '#ff9800',
  },

  // Network Quality Indicators
  networkQuality: {
    excellent: '#4caf50',
    good: '#8bc34a',
    fair: '#ff9800',
    poor: '#f44336',
    unknown: '#9e9e9e',
  },

  // Chat Reactions
  reactions: {
    like: '#4caf50',
    love: '#e91e63',
    laugh: '#ffeb3b',
    surprised: '#ff9800',
    sad: '#2196f3',
    celebrate: '#9c27b0',
  },

  // Calendar Event Types
  calendarEvent: {
    skillExchange: '#ff9800',
    monetary: '#2196f3',
    default: '#9c27b0',
  },
} as const;

// ============================================================================
// Gradient Presets
// ============================================================================

export const gradients = {
  primary: 'linear-gradient(135deg, #4caf50 0%, #087f23 100%)',
  secondary: 'linear-gradient(135deg, #ff9800 0%, #c66900 100%)',
  hero: 'linear-gradient(135deg, #4caf50 0%, #2196f3 100%)',
  dark: 'linear-gradient(135deg, #424242 0%, #212121 100%)',
  success: 'linear-gradient(135deg, #66bb6a 0%, #388e3c 100%)',
} as const;

// ============================================================================
// Shadow Colors
// ============================================================================

export const shadowColors = {
  light: {
    elevation1: 'rgba(0, 0, 0, 0.05)',
    elevation2: 'rgba(0, 0, 0, 0.08)',
    elevation3: 'rgba(0, 0, 0, 0.12)',
    primary: 'rgba(76, 175, 80, 0.25)',
    error: 'rgba(244, 67, 54, 0.25)',
  },
  dark: {
    elevation1: 'rgba(0, 0, 0, 0.3)',
    elevation2: 'rgba(0, 0, 0, 0.4)',
    elevation3: 'rgba(0, 0, 0, 0.5)',
    primary: 'rgba(76, 175, 80, 0.4)',
    error: 'rgba(244, 67, 54, 0.4)',
  },
} as const;

// ============================================================================
// Types
// ============================================================================

export type BrandColorScale = typeof brandColors.primary;
export type SemanticColor = typeof semanticColors.success;
export type ThemeMode = 'light' | 'dark';
