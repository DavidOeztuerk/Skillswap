/**
 * Design Tokens Index
 *
 * Central export for all design tokens used in the Skillswap application.
 * Import tokens from this file for consistent styling across components.
 *
 * Usage:
 * ```tsx
 * import { brandColors, spacing, fontSizes } from '@/styles/tokens';
 *
 * const MyComponent = () => (
 *   <Box
 *     sx={{
 *       backgroundColor: brandColors.primary[500],
 *       padding: spacing[2],
 *       fontSize: fontSizes.md,
 *     }}
 *   >
 *     Content
 *   </Box>
 * );
 * ```
 */

// Color Tokens
export {
  brandColors,
  semanticColors,
  neutralColors,
  backgroundColors,
  textColors,
  featureColors,
  gradients,
  shadowColors,
} from './colors';

export type { BrandColorScale, SemanticColor, ThemeMode } from './colors';

// Spacing Tokens
export {
  spacing,
  semanticSpacing,
  componentSpacing,
  responsiveSpacing,
  layoutSpacing,
  getSpacing,
  getSpacingPx,
  createSpacing,
} from './spacing';

export type { SpacingKey, SpacingValue } from './spacing';

// Typography Tokens
export {
  fontFamilies,
  fontWeights,
  fontSizes,
  lineHeights,
  letterSpacing,
  typographyVariants,
  responsiveTypography,
  semanticTypography,
  textTruncation,
} from './typography';

export type { FontFamily, FontWeight, FontSize, LineHeight, TypographyVariant } from './typography';
