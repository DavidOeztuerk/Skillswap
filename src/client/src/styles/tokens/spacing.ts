/**
 * Spacing Design Tokens
 *
 * Based on 8px grid system for consistent spacing throughout the app.
 * All spacing values are multiples of 8px.
 */

// ============================================================================
// Base Spacing Scale (8px grid)
// ============================================================================

export const spacing = {
  /** 0px */
  0: 0,
  /** 4px - Half unit for tight spacing */
  0.5: 4,
  /** 8px - Base unit */
  1: 8,
  /** 12px */
  1.5: 12,
  /** 16px */
  2: 16,
  /** 20px */
  2.5: 20,
  /** 24px */
  3: 24,
  /** 32px */
  4: 32,
  /** 40px */
  5: 40,
  /** 48px */
  6: 48,
  /** 56px */
  7: 56,
  /** 64px */
  8: 64,
  /** 80px */
  10: 80,
  /** 96px */
  12: 96,
  /** 128px */
  16: 128,
  /** 160px */
  20: 160,
  /** 192px */
  24: 192,
} as const;

// ============================================================================
// Semantic Spacing
// ============================================================================

export const semanticSpacing = {
  /** Spacing within compact components like chips, badges */
  compact: spacing[0.5], // 4px

  /** Standard spacing within components */
  inset: spacing[2], // 16px

  /** Standard gap between related elements */
  gap: spacing[1], // 8px

  /** Larger gap between sections */
  sectionGap: spacing[3], // 24px

  /** Page margins on mobile */
  pageMobile: spacing[2], // 16px

  /** Page margins on desktop */
  pageDesktop: spacing[4], // 32px

  /** Form field spacing */
  formField: spacing[2], // 16px

  /** Card padding */
  cardPadding: spacing[3], // 24px

  /** Card padding on mobile */
  cardPaddingMobile: spacing[2], // 16px

  /** Modal padding */
  modalPadding: spacing[4], // 32px

  /** Dialog padding on mobile */
  modalPaddingMobile: spacing[3], // 24px

  /** Header/Toolbar height */
  toolbarHeight: spacing[8], // 64px

  /** Bottom navigation height */
  bottomNavHeight: spacing[7], // 56px
} as const;

// ============================================================================
// Component-Specific Spacing
// ============================================================================

export const componentSpacing = {
  // Buttons
  button: {
    paddingX: spacing[2.5], // 20px
    paddingY: spacing[1.5], // 12px
    paddingXSmall: spacing[2], // 16px
    paddingYSmall: spacing[1], // 8px
    paddingXLarge: spacing[3], // 24px
    paddingYLarge: spacing[2], // 16px
    iconGap: spacing[1], // 8px
  },

  // Cards
  card: {
    padding: spacing[3], // 24px
    paddingMobile: spacing[2], // 16px
    headerPadding: spacing[2], // 16px
    actionsPadding: spacing[2], // 16px
    gap: spacing[2], // 16px
  },

  // Forms
  form: {
    fieldGap: spacing[2], // 16px
    sectionGap: spacing[3], // 24px
    labelMargin: spacing[1], // 8px
    helperMargin: spacing[0.5], // 4px
  },

  // Lists
  list: {
    itemPadding: spacing[2], // 16px
    itemGap: spacing[1], // 8px
    iconGap: spacing[2], // 16px
    dense: {
      itemPadding: spacing[1], // 8px
      itemGap: spacing[0.5], // 4px
    },
  },

  // Dialogs/Modals
  dialog: {
    padding: spacing[3], // 24px
    paddingMobile: spacing[2], // 16px
    titlePadding: spacing[3], // 24px
    actionsPadding: spacing[2], // 16px
    gap: spacing[2], // 16px
  },

  // Tables
  table: {
    cellPadding: spacing[2], // 16px
    cellPaddingCompact: spacing[1], // 8px
    headerPadding: spacing[2], // 16px
  },

  // Navigation
  navigation: {
    itemPadding: spacing[1.5], // 12px
    itemGap: spacing[0.5], // 4px
    sidebarWidth: 240,
    sidebarCollapsedWidth: 64,
    drawerWidth: 280,
  },

  // Avatar
  avatar: {
    sizeSmall: spacing[4], // 32px
    sizeMedium: spacing[5], // 40px
    sizeLarge: spacing[6], // 48px
    sizeXLarge: spacing[8], // 64px
    gap: spacing[1], // 8px
  },

  // Chips/Tags
  chip: {
    paddingX: spacing[1.5], // 12px
    paddingY: spacing[0.5], // 4px
    gap: spacing[1], // 8px
  },

  // Video Call
  videoCall: {
    controlsHeight: spacing[10], // 80px
    pipWidth: 200,
    pipHeight: 150,
    controlGap: spacing[2], // 16px
    fabSize: spacing[7], // 56px
  },
} as const;

// ============================================================================
// Responsive Breakpoint Spacing
// ============================================================================

export const responsiveSpacing = {
  container: {
    xs: spacing[2], // 16px padding
    sm: spacing[3], // 24px padding
    md: spacing[4], // 32px padding
    lg: spacing[5], // 40px padding
    xl: spacing[6], // 48px padding
  },
  gutter: {
    xs: spacing[2], // 16px
    sm: spacing[2], // 16px
    md: spacing[3], // 24px
    lg: spacing[3], // 24px
    xl: spacing[4], // 32px
  },
} as const;

// ============================================================================
// Layout Spacing
// ============================================================================

export const layoutSpacing = {
  /** Maximum content width for readability */
  maxContentWidth: 1200,

  /** Maximum text width for readability */
  maxTextWidth: 680,

  /** Sidebar widths */
  sidebarWidth: 240,
  sidebarCollapsedWidth: 64,

  /** Header heights */
  headerHeight: 64,
  headerHeightMobile: 56,

  /** Footer heights */
  footerHeight: 80,

  /** Bottom navigation */
  bottomNavHeight: 56,

  /** Fixed action button position */
  fabBottom: spacing[2], // 16px
  fabRight: spacing[2], // 16px
} as const;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get spacing value in pixels
 */
export const getSpacing = (multiplier: keyof typeof spacing): number => spacing[multiplier];

/**
 * Get spacing value as CSS string
 */
export const getSpacingPx = (multiplier: keyof typeof spacing): string =>
  `${spacing[multiplier]}px`;

/**
 * Create spacing shorthand (like CSS padding/margin)
 * Follows CSS shorthand convention: top right bottom left
 */
export const createSpacing = (
  top: keyof typeof spacing,
  right?: keyof typeof spacing,
  bottom?: keyof typeof spacing,
  left?: keyof typeof spacing
): string => {
  const topValue = spacing[top];
  const rightValue = right === undefined ? topValue : spacing[right];
  const bottomValue = bottom === undefined ? topValue : spacing[bottom];
  const leftValue = left === undefined ? rightValue : spacing[left];

  return [topValue, rightValue, bottomValue, leftValue].map((v) => `${v}px`).join(' ');
};

// ============================================================================
// Types
// ============================================================================

export type SpacingKey = keyof typeof spacing;
export type SpacingValue = (typeof spacing)[SpacingKey];
