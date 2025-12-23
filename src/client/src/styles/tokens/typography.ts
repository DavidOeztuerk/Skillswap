/**
 * Typography Design Tokens
 *
 * Consistent typography scale and styles for the Skillswap application.
 * Based on Material Design typography guidelines with responsive adjustments.
 */

// ============================================================================
// Font Families
// ============================================================================

export const fontFamilies = {
  /** Primary font for body text and UI */
  primary: 'Roboto, "Helvetica Neue", Arial, sans-serif',

  /** Monospace font for code and technical content */
  mono: '"Roboto Mono", Consolas, Monaco, "Courier New", monospace',

  /** Display font for large headings (same as primary for now) */
  display: 'Roboto, "Helvetica Neue", Arial, sans-serif',
} as const;

// ============================================================================
// Font Weights
// ============================================================================

export const fontWeights = {
  light: 300,
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
} as const;

// ============================================================================
// Font Sizes (rem-based for accessibility)
// ============================================================================

export const fontSizes = {
  /** 12px */
  xs: '0.75rem',
  /** 14px */
  sm: '0.875rem',
  /** 16px - Base */
  md: '1rem',
  /** 18px */
  lg: '1.125rem',
  /** 20px */
  xl: '1.25rem',
  /** 24px */
  '2xl': '1.5rem',
  /** 28px */
  '3xl': '1.75rem',
  /** 32px */
  '4xl': '2rem',
  /** 40px */
  '5xl': '2.5rem',
  /** 48px */
  '6xl': '3rem',
} as const;

// ============================================================================
// Line Heights
// ============================================================================

export const lineHeights = {
  /** Tight - for headings */
  tight: 1.2,
  /** Snug - for subheadings */
  snug: 1.3,
  /** Normal - for body text */
  normal: 1.5,
  /** Relaxed - for longer content */
  relaxed: 1.6,
  /** Loose - for captions */
  loose: 1.75,
} as const;

// ============================================================================
// Letter Spacing
// ============================================================================

export const letterSpacing = {
  tighter: '-0.05em',
  tight: '-0.025em',
  normal: '0',
  wide: '0.025em',
  wider: '0.05em',
  widest: '0.1em',
} as const;

// ============================================================================
// Typography Variants (following MUI typography)
// ============================================================================

export const typographyVariants = {
  h1: {
    fontFamily: fontFamilies.display,
    fontWeight: fontWeights.medium,
    fontSize: fontSizes['5xl'],
    lineHeight: lineHeights.tight,
    letterSpacing: letterSpacing.tight,
  },
  h2: {
    fontFamily: fontFamilies.display,
    fontWeight: fontWeights.medium,
    fontSize: fontSizes['4xl'],
    lineHeight: lineHeights.tight,
    letterSpacing: letterSpacing.tight,
  },
  h3: {
    fontFamily: fontFamilies.display,
    fontWeight: fontWeights.medium,
    fontSize: fontSizes['3xl'],
    lineHeight: lineHeights.snug,
    letterSpacing: letterSpacing.normal,
  },
  h4: {
    fontFamily: fontFamilies.display,
    fontWeight: fontWeights.medium,
    fontSize: fontSizes['2xl'],
    lineHeight: lineHeights.snug,
    letterSpacing: letterSpacing.normal,
  },
  h5: {
    fontFamily: fontFamilies.display,
    fontWeight: fontWeights.medium,
    fontSize: fontSizes.xl,
    lineHeight: lineHeights.normal,
    letterSpacing: letterSpacing.normal,
  },
  h6: {
    fontFamily: fontFamilies.display,
    fontWeight: fontWeights.medium,
    fontSize: fontSizes.md,
    lineHeight: lineHeights.normal,
    letterSpacing: letterSpacing.normal,
  },
  subtitle1: {
    fontFamily: fontFamilies.primary,
    fontWeight: fontWeights.medium,
    fontSize: fontSizes.md,
    lineHeight: lineHeights.normal,
    letterSpacing: letterSpacing.normal,
  },
  subtitle2: {
    fontFamily: fontFamilies.primary,
    fontWeight: fontWeights.medium,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.normal,
    letterSpacing: letterSpacing.normal,
  },
  body1: {
    fontFamily: fontFamilies.primary,
    fontWeight: fontWeights.regular,
    fontSize: fontSizes.md,
    lineHeight: lineHeights.relaxed,
    letterSpacing: letterSpacing.normal,
  },
  body2: {
    fontFamily: fontFamilies.primary,
    fontWeight: fontWeights.regular,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.relaxed,
    letterSpacing: letterSpacing.normal,
  },
  button: {
    fontFamily: fontFamilies.primary,
    fontWeight: fontWeights.medium,
    fontSize: fontSizes.md,
    lineHeight: lineHeights.normal,
    letterSpacing: letterSpacing.wide,
    textTransform: 'none' as const,
  },
  caption: {
    fontFamily: fontFamilies.primary,
    fontWeight: fontWeights.regular,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.normal,
    letterSpacing: letterSpacing.normal,
  },
  overline: {
    fontFamily: fontFamilies.primary,
    fontWeight: fontWeights.medium,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.normal,
    letterSpacing: letterSpacing.widest,
    textTransform: 'uppercase' as const,
  },
} as const;

// ============================================================================
// Responsive Typography Adjustments
// ============================================================================

export const responsiveTypography = {
  // Mobile (< 600px)
  mobile: {
    h1: { fontSize: fontSizes['3xl'] },
    h2: { fontSize: fontSizes['2xl'] },
    h3: { fontSize: fontSizes.xl },
    h4: { fontSize: fontSizes.lg },
    h5: { fontSize: fontSizes.md },
    h6: { fontSize: fontSizes.sm },
    body1: { fontSize: fontSizes.sm },
  },
  // Tablet (600px - 900px)
  tablet: {
    h1: { fontSize: fontSizes['4xl'] },
    h2: { fontSize: fontSizes['3xl'] },
    h3: { fontSize: fontSizes['2xl'] },
    h4: { fontSize: fontSizes.xl },
    h5: { fontSize: fontSizes.lg },
    h6: { fontSize: fontSizes.md },
  },
} as const;

// ============================================================================
// Semantic Typography Styles
// ============================================================================

export const semanticTypography = {
  /** Page title */
  pageTitle: typographyVariants.h4,

  /** Section heading */
  sectionTitle: typographyVariants.h5,

  /** Card title */
  cardTitle: typographyVariants.h6,

  /** Form label */
  label: {
    ...typographyVariants.body2,
    fontWeight: fontWeights.medium,
  },

  /** Error text */
  error: {
    ...typographyVariants.caption,
    color: 'error.main',
  },

  /** Helper text */
  helper: typographyVariants.caption,

  /** Code/Technical text */
  code: {
    fontFamily: fontFamilies.mono,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.relaxed,
  },

  /** Badge/Tag text */
  badge: {
    fontFamily: fontFamilies.primary,
    fontWeight: fontWeights.medium,
    fontSize: fontSizes.xs,
    lineHeight: 1,
    letterSpacing: letterSpacing.wide,
  },

  /** Status text */
  status: {
    fontFamily: fontFamilies.primary,
    fontWeight: fontWeights.medium,
    fontSize: fontSizes.xs,
    textTransform: 'uppercase' as const,
    letterSpacing: letterSpacing.wider,
  },
} as const;

// ============================================================================
// Text Truncation Utilities
// ============================================================================

export const textTruncation = {
  /** Single line truncation */
  singleLine: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },

  /** Multi-line truncation (with line clamp) */
  multiLine: (lines: number) => ({
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    WebkitLineClamp: lines,
    WebkitBoxOrient: 'vertical' as const,
  }),
} as const;

// ============================================================================
// Types
// ============================================================================

export type FontFamily = keyof typeof fontFamilies;
export type FontWeight = keyof typeof fontWeights;
export type FontSize = keyof typeof fontSizes;
export type LineHeight = keyof typeof lineHeights;
export type TypographyVariant = keyof typeof typographyVariants;
