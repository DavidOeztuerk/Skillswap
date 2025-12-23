import type { PaletteMode, ThemeOptions } from '@mui/material';
import { brandColors, backgroundColors, textColors, semanticColors } from './tokens/colors';

/**
 * MUI Theme Options
 *
 * This theme uses design tokens as the single source of truth for colors.
 * All color values are imported from ./tokens/colors.ts to ensure consistency.
 */
export const getThemeOptions = (mode: PaletteMode): ThemeOptions => ({
  palette: {
    mode,
    primary: {
      main: brandColors.primary[500],
      light: brandColors.primary[300],
      dark: brandColors.primary[700],
      contrastText: '#ffffff',
    },
    secondary: {
      main: brandColors.secondary[500],
      light: brandColors.secondary[300],
      dark: brandColors.secondary[700],
      contrastText: '#000000',
    },
    background: {
      default: mode === 'light' ? backgroundColors.light.default : backgroundColors.dark.default,
      paper: mode === 'light' ? backgroundColors.light.paper : backgroundColors.dark.paper,
    },
    text: {
      primary: mode === 'light' ? textColors.light.primary : textColors.dark.primary,
      secondary: mode === 'light' ? textColors.light.secondary : textColors.dark.secondary,
    },
    error: {
      main: semanticColors.error.main,
      light: semanticColors.error.light,
      dark: semanticColors.error.dark,
    },
    warning: {
      main: semanticColors.warning.main,
      light: semanticColors.warning.light,
      dark: semanticColors.warning.dark,
    },
    info: {
      main: semanticColors.info.main,
      light: semanticColors.info.light,
      dark: semanticColors.info.dark,
    },
    success: {
      main: semanticColors.success.main,
      light: semanticColors.success.light,
      dark: semanticColors.success.dark,
    },
  },
  typography: {
    fontFamily: 'Roboto, "Helvetica Neue", Arial, sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 500,
      lineHeight: 1.2,
      '@media (max-width:900px)': {
        fontSize: '2.125rem',
      },
      '@media (max-width:600px)': {
        fontSize: '1.75rem',
        lineHeight: 1.3,
      },
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 500,
      lineHeight: 1.2,
      '@media (max-width:900px)': {
        fontSize: '1.875rem',
      },
      '@media (max-width:600px)': {
        fontSize: '1.5rem',
        lineHeight: 1.3,
      },
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 500,
      lineHeight: 1.3,
      '@media (max-width:900px)': {
        fontSize: '1.5rem',
      },
      '@media (max-width:600px)': {
        fontSize: '1.25rem',
        lineHeight: 1.4,
      },
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 500,
      lineHeight: 1.3,
      '@media (max-width:900px)': {
        fontSize: '1.25rem',
      },
      '@media (max-width:600px)': {
        fontSize: '1.125rem',
        lineHeight: 1.4,
      },
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 500,
      lineHeight: 1.4,
      '@media (max-width:900px)': {
        fontSize: '1.125rem',
      },
      '@media (max-width:600px)': {
        fontSize: '1rem',
      },
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 500,
      lineHeight: 1.4,
      '@media (max-width:600px)': {
        fontSize: '0.875rem',
      },
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
      '@media (max-width:600px)': {
        fontSize: '0.875rem',
        lineHeight: 1.5,
      },
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.6,
      '@media (max-width:600px)': {
        fontSize: '0.75rem',
        lineHeight: 1.5,
      },
    },
    button: {
      textTransform: 'none' as const,
      fontWeight: 500,
      fontSize: '1rem',
      '@media (max-width:600px)': {
        fontSize: '0.875rem',
      },
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none' as const,
          padding: '12px 20px',
          fontWeight: 500,
          minHeight: 48, // Improved touch target
          '@media (max-width: 600px)': {
            padding: '16px 24px',
            minHeight: 52, // Larger touch target on mobile
            fontSize: '1rem', // Larger text on mobile
          },
        },
        sizeSmall: {
          padding: '8px 16px',
          minHeight: 40,
          '@media (max-width: 600px)': {
            padding: '12px 20px',
            minHeight: 44,
          },
        },
        sizeLarge: {
          padding: '16px 24px',
          minHeight: 56,
          '@media (max-width: 600px)': {
            padding: '20px 28px',
            minHeight: 60,
          },
        },
        containedPrimary: {
          '&:hover': {
            boxShadow: '0px 4px 10px rgba(76, 175, 80, 0.25)',
          },
          '&:active': {
            transform: 'scale(0.98)',
            transition: 'transform 0.1s ease-in-out',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
        elevation1: {
          boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.05)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          overflow: 'hidden',
          '@media (max-width: 600px)': {
            borderRadius: 8,
            margin: '8px 0',
          },
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: 24,
          '&:last-child': {
            paddingBottom: 24,
          },
          '@media (max-width: 600px)': {
            padding: '16px',
            '&:last-child': {
              paddingBottom: 16,
            },
          },
        },
      },
    },
    MuiCardActions: {
      styleOverrides: {
        root: {
          padding: '16px 24px',
          '@media (max-width: 600px)': {
            padding: '12px 16px',
            flexDirection: 'column',
            gap: '8px',
            '& > :not(:first-of-type)': {
              marginLeft: 0,
            },
          },
        },
      },
    },
    MuiCardHeader: {
      styleOverrides: {
        root: {
          padding: '16px 24px',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          borderBottom: '1px solid',
          borderBottomColor: mode === 'light' ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.12)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            fontSize: '16px', // Prevent zoom on iOS
            '@media (max-width: 600px)': {
              fontSize: '16px', // Ensure 16px minimum on mobile
            },
          },
          '& .MuiInputBase-root': {
            minHeight: 48,
            '@media (max-width: 600px)': {
              minHeight: 52,
            },
          },
          '& .MuiFormHelperText-root': {
            '@media (max-width: 600px)': {
              fontSize: '0.75rem',
            },
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          minWidth: 44,
          minHeight: 44,
          '@media (max-width: 600px)': {
            minWidth: 48,
            minHeight: 48,
            padding: '12px',
          },
        },
        sizeSmall: {
          minWidth: 36,
          minHeight: 36,
          '@media (max-width: 600px)': {
            minWidth: 40,
            minHeight: 40,
            padding: '8px',
          },
        },
      },
    },
    MuiFab: {
      styleOverrides: {
        root: {
          minWidth: 56,
          minHeight: 56,
          '@media (max-width: 600px)': {
            minWidth: 64,
            minHeight: 64,
          },
        },
        sizeSmall: {
          minWidth: 40,
          minHeight: 40,
          '@media (max-width: 600px)': {
            minWidth: 48,
            minHeight: 48,
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 16,
        },
      },
    },
  },
});
