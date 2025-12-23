/**
 * Style Mixins
 *
 * Reusable style patterns for consistent UI across components.
 * Use these mixins in sx props to reduce code duplication.
 *
 * @example
 * import { mixins } from '../styles/mixins';
 *
 * <Box sx={{ ...mixins.flexCenter, gap: 2 }}>
 *   <Typography sx={mixins.truncate}>Long text here...</Typography>
 * </Box>
 */

import type { SxProps, Theme } from '@mui/material';

// ============================================================================
// Flexbox Mixins
// ============================================================================

export const flexMixins = {
  /** Center items horizontally and vertically */
  center: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  } as const,

  /** Space items evenly with center alignment */
  between: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  } as const,

  /** Align items at start with space between */
  startBetween: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  } as const,

  /** Column layout */
  column: {
    display: 'flex',
    flexDirection: 'column',
  } as const,

  /** Column layout centered */
  columnCenter: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  } as const,

  /** Row layout with center alignment */
  row: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  } as const,

  /** Wrap items */
  wrap: {
    display: 'flex',
    flexWrap: 'wrap',
  } as const,
} as const;

// ============================================================================
// Text Mixins
// ============================================================================

export const textMixins = {
  /** Single line text truncation with ellipsis */
  truncate: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  } as const,

  /** Multi-line text truncation (2 lines) */
  truncate2: {
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  } as const,

  /** Multi-line text truncation (3 lines) */
  truncate3: {
    display: '-webkit-box',
    WebkitLineClamp: 3,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  } as const,

  /** Bold text */
  bold: {
    fontWeight: 600,
  } as const,

  /** Capitalize text */
  capitalize: {
    textTransform: 'capitalize',
  } as const,

  /** Uppercase text */
  uppercase: {
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  } as const,

  /** No text selection */
  noSelect: {
    userSelect: 'none',
    WebkitUserSelect: 'none',
  } as const,
} as const;

/**
 * Create multi-line truncation with custom line count
 */
export const multiLineTruncate = (lines: number): SxProps<Theme> => ({
  display: '-webkit-box',
  WebkitLineClamp: lines,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
});

// ============================================================================
// Layout Mixins
// ============================================================================

export const layoutMixins = {
  /** Fill parent container */
  fill: {
    width: '100%',
    height: '100%',
  } as const,

  /** Absolute positioning to fill parent */
  absoluteFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  } as const,

  /** Fixed positioning to fill viewport */
  fixedFill: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  } as const,

  /** Sticky header */
  stickyTop: {
    position: 'sticky',
    top: 0,
    zIndex: 10,
  } as const,

  /** Hide scrollbar but keep scrolling */
  hideScrollbar: {
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
    '&::-webkit-scrollbar': {
      display: 'none',
    },
  } as const,

  /** Smooth scrolling container */
  smoothScroll: {
    overflowY: 'auto',
    scrollBehavior: 'smooth',
    WebkitOverflowScrolling: 'touch',
  } as const,
} as const;

// ============================================================================
// Overlay Mixins
// ============================================================================

export const overlayMixins = {
  /** Dark overlay (60% opacity) */
  dark: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  } as const,

  /** Light overlay (60% opacity) */
  light: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  } as const,

  /** Backdrop blur */
  blur: {
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
  } as const,

  /** Glass effect */
  glass: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
  } as const,
} as const;

/**
 * Create overlay with custom opacity
 */
export const overlay = (opacity = 0.6): SxProps<Theme> => ({
  backgroundColor: `rgba(0, 0, 0, ${opacity})`,
});

// ============================================================================
// Interactive Mixins
// ============================================================================

export const interactiveMixins = {
  /** Minimum touch target size (44px) */
  touchTarget: {
    minWidth: 44,
    minHeight: 44,
  } as const,

  /** Mobile touch target size (48px) */
  mobileTouchTarget: {
    minWidth: 48,
    minHeight: 48,
  } as const,

  /** Clickable cursor */
  clickable: {
    cursor: 'pointer',
  } as const,

  /** Disabled state */
  disabled: {
    opacity: 0.5,
    pointerEvents: 'none',
    cursor: 'not-allowed',
  } as const,

  /** Focus visible ring */
  focusRing: {
    '&:focus-visible': {
      outline: '2px solid',
      outlineColor: 'primary.main',
      outlineOffset: 2,
    },
  } as const,

  /** Remove tap highlight on mobile */
  noTapHighlight: {
    WebkitTapHighlightColor: 'transparent',
  } as const,
} as const;

// ============================================================================
// Card Mixins
// ============================================================================

export const cardMixins = {
  /** Base card styles */
  base: {
    borderRadius: 2,
    overflow: 'hidden',
  } as const,

  /** Elevated card with hover effect */
  elevated: {
    borderRadius: 2,
    overflow: 'hidden',
    boxShadow: 2,
    transition: 'box-shadow 0.2s ease-in-out',
    '&:hover': {
      boxShadow: 4,
    },
  } as const,

  /** Outlined card */
  outlined: {
    borderRadius: 2,
    overflow: 'hidden',
    border: 1,
    borderColor: 'divider',
  } as const,

  /** Interactive card */
  interactive: {
    borderRadius: 2,
    overflow: 'hidden',
    cursor: 'pointer',
    transition: 'all 0.2s ease-in-out',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: 4,
    },
  } as const,
} as const;

// ============================================================================
// Animation Mixins
// ============================================================================

export const animationMixins = {
  /** Fade in animation */
  fadeIn: {
    animation: 'fadeIn 0.3s ease-in-out',
    '@keyframes fadeIn': {
      from: { opacity: 0 },
      to: { opacity: 1 },
    },
  } as const,

  /** Slide up animation */
  slideUp: {
    animation: 'slideUp 0.3s ease-out',
    '@keyframes slideUp': {
      from: { transform: 'translateY(20px)', opacity: 0 },
      to: { transform: 'translateY(0)', opacity: 1 },
    },
  } as const,

  /** Pulse animation */
  pulse: {
    animation: 'pulse 2s infinite',
    '@keyframes pulse': {
      '0%, 100%': { opacity: 1 },
      '50%': { opacity: 0.5 },
    },
  } as const,

  /** Spin animation */
  spin: {
    animation: 'spin 1s linear infinite',
    '@keyframes spin': {
      from: { transform: 'rotate(0deg)' },
      to: { transform: 'rotate(360deg)' },
    },
  } as const,
} as const;

// ============================================================================
// Combined Mixins Export
// ============================================================================

export const mixins = {
  // Flexbox shortcuts
  flexCenter: flexMixins.center,
  flexBetween: flexMixins.between,
  flexColumn: flexMixins.column,
  flexRow: flexMixins.row,

  // Text shortcuts
  truncate: textMixins.truncate,
  truncate2: textMixins.truncate2,
  truncate3: textMixins.truncate3,
  bold: textMixins.bold,
  noSelect: textMixins.noSelect,

  // Layout shortcuts
  fill: layoutMixins.fill,
  absoluteFill: layoutMixins.absoluteFill,
  stickyTop: layoutMixins.stickyTop,
  hideScrollbar: layoutMixins.hideScrollbar,

  // Overlay shortcuts
  overlayDark: overlayMixins.dark,
  overlayLight: overlayMixins.light,
  blur: overlayMixins.blur,
  glass: overlayMixins.glass,

  // Interactive shortcuts
  touchTarget: interactiveMixins.touchTarget,
  mobileTouchTarget: interactiveMixins.mobileTouchTarget,
  clickable: interactiveMixins.clickable,
  focusRing: interactiveMixins.focusRing,

  // Card shortcuts
  card: cardMixins.base,
  cardElevated: cardMixins.elevated,
  cardInteractive: cardMixins.interactive,

  // Animation shortcuts
  fadeIn: animationMixins.fadeIn,
  slideUp: animationMixins.slideUp,
  pulse: animationMixins.pulse,
  spin: animationMixins.spin,
} as const;
