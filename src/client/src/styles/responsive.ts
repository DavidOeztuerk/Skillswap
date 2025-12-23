/**
 * Responsive Design Utilities
 *
 * Provides consistent responsive breakpoints, grid configurations,
 * and responsive style helpers for the Skillswap application.
 */

import type { SxProps, Theme, Breakpoint } from '@mui/material';

// ============================================================================
// Breakpoint Values (matching MUI defaults)
// ============================================================================

export const breakpoints = {
  xs: 0,
  sm: 600,
  md: 900,
  lg: 1200,
  xl: 1536,
} as const;

// ============================================================================
// Responsive Grid Column Configurations
// ============================================================================

/**
 * Standard grid configurations for different content types
 */
export const gridConfigs = {
  /** Cards in a list (skills, matches, appointments) */
  cards: {
    xs: 12,
    sm: 6,
    md: 4,
    lg: 3,
  },

  /** Two-column layout */
  twoColumn: {
    xs: 12,
    sm: 6,
  },

  /** Three-column layout */
  threeColumn: {
    xs: 12,
    sm: 6,
    md: 4,
  },

  /** Four-column layout */
  fourColumn: {
    xs: 12,
    sm: 6,
    md: 4,
    lg: 3,
  },

  /** Main content + sidebar */
  mainWithSidebar: {
    main: { xs: 12, md: 8, lg: 9 },
    sidebar: { xs: 12, md: 4, lg: 3 },
  },

  /** Equal two-column on tablet+ */
  equalHalves: {
    xs: 12,
    md: 6,
  },

  /** Dashboard stats - single column on extra small, 2 on small, 4 on medium+ */
  stats: {
    xs: 12, // Full width on very small mobile (< 600px)
    sm: 6, // 2 per row on small (600px+)
    md: 3, // 4 per row on medium+ (900px+)
  },

  /** Form fields - full width on mobile, half on larger */
  formField: {
    xs: 12,
    sm: 6,
  },

  /** Form fields - always full width */
  formFieldFull: {
    xs: 12,
  },
} as const;

// ============================================================================
// Responsive Spacing
// ============================================================================

/**
 * Responsive container padding
 */
export const containerPadding: SxProps<Theme> = {
  px: { xs: 2, sm: 3, md: 4 },
  py: { xs: 2, sm: 3, md: 4 },
};

/**
 * Responsive section spacing
 */
export const sectionSpacing: SxProps<Theme> = {
  mb: { xs: 3, sm: 4, md: 5 },
};

/**
 * Responsive card gap for Grid container
 */
export const cardGridSpacing = {
  xs: 2,
  sm: 2,
  md: 3,
} as const;

// ============================================================================
// Responsive Style Helpers
// ============================================================================

/**
 * Hide element below a breakpoint
 */
export const hideBelow = (breakpoint: Breakpoint): SxProps<Theme> => ({
  display: { xs: 'none', [breakpoint]: 'block' },
});

/**
 * Hide element above a breakpoint
 */
export const hideAbove = (breakpoint: Breakpoint): SxProps<Theme> => ({
  display: { xs: 'block', [breakpoint]: 'none' },
});

/**
 * Show element only on mobile (xs)
 */
export const mobileOnly: SxProps<Theme> = {
  display: { xs: 'block', sm: 'none' },
};

/**
 * Show element only on tablet and up
 */
export const tabletUp: SxProps<Theme> = {
  display: { xs: 'none', sm: 'block' },
};

/**
 * Show element only on desktop and up
 */
export const desktopUp: SxProps<Theme> = {
  display: { xs: 'none', md: 'block' },
};

// ============================================================================
// Responsive Text Alignment
// ============================================================================

export const responsiveTextAlign = {
  /** Center on mobile, left on larger */
  centerToLeft: {
    textAlign: { xs: 'center', sm: 'left' },
  } as SxProps<Theme>,

  /** Left on mobile, center on larger */
  leftToCenter: {
    textAlign: { xs: 'left', md: 'center' },
  } as SxProps<Theme>,
};

// ============================================================================
// Responsive Flex Direction
// ============================================================================

export const responsiveFlexDirection = {
  /** Column on mobile, row on larger */
  columnToRow: {
    flexDirection: { xs: 'column', sm: 'row' },
  } as SxProps<Theme>,

  /** Row on mobile, column on larger */
  rowToColumn: {
    flexDirection: { xs: 'row', md: 'column' },
  } as SxProps<Theme>,
};

// ============================================================================
// Common Responsive Patterns
// ============================================================================

/**
 * Responsive card container styles
 */
export const responsiveCardContainer: SxProps<Theme> = {
  p: { xs: 2, sm: 3 },
  borderRadius: { xs: 1, sm: 2 },
};

/**
 * Responsive modal/dialog styles
 */
export const responsiveDialog: SxProps<Theme> = {
  p: { xs: 2, sm: 3, md: 4 },
  maxWidth: { xs: '100%', sm: 500, md: 600 },
  mx: { xs: 1, sm: 'auto' },
};

/**
 * Responsive page header styles
 */
export const responsivePageHeader: SxProps<Theme> = {
  mb: { xs: 2, sm: 3, md: 4 },
  px: { xs: 0, sm: 1 },
};

/**
 * Responsive action buttons container
 */
export const responsiveActions: SxProps<Theme> = {
  display: 'flex',
  flexDirection: { xs: 'column', sm: 'row' },
  gap: { xs: 1, sm: 2 },
  width: { xs: '100%', sm: 'auto' },
  '& > button': {
    width: { xs: '100%', sm: 'auto' },
  },
};

/**
 * Responsive stack/flex gap
 */
export const responsiveGap: SxProps<Theme> = {
  gap: { xs: 1, sm: 2, md: 3 },
};

// ============================================================================
// Typography Responsive Helpers
// ============================================================================

/**
 * Responsive heading that scales down on mobile
 */
export const responsiveHeading: SxProps<Theme> = {
  fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
  fontWeight: 500,
};

/**
 * Responsive subheading
 */
export const responsiveSubheading: SxProps<Theme> = {
  fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' },
  color: 'text.secondary',
};

// ============================================================================
// Media Query Helpers
// ============================================================================

/**
 * Create a responsive value object
 */
export const responsive = <T>(
  xs: T,
  sm?: T,
  md?: T,
  lg?: T,
  xl?: T
): { xs: T; sm?: T; md?: T; lg?: T; xl?: T } => ({
  xs,
  ...(sm !== undefined && { sm }),
  ...(md !== undefined && { md }),
  ...(lg !== undefined && { lg }),
  ...(xl !== undefined && { xl }),
});

/**
 * Create responsive padding
 */
export const responsivePadding = (
  xsValue: number,
  smValue?: number,
  mdValue?: number
): SxProps<Theme> => ({
  p: responsive(xsValue, smValue ?? xsValue, mdValue ?? smValue ?? xsValue),
});

/**
 * Create responsive margin
 */
export const responsiveMargin = (
  xsValue: number,
  smValue?: number,
  mdValue?: number
): SxProps<Theme> => ({
  m: responsive(xsValue, smValue ?? xsValue, mdValue ?? smValue ?? xsValue),
});

// ============================================================================
// Dashboard-specific layouts
// ============================================================================

export const dashboardLayouts = {
  /** Stats cards row */
  statsRow: {
    container: {
      spacing: { xs: 2, md: 3 },
    },
    item: gridConfigs.stats,
  },

  /** Main content area */
  mainContent: {
    container: {
      spacing: { xs: 2, md: 3 },
    },
    wide: { xs: 12, lg: 8 },
    narrow: { xs: 12, lg: 4 },
  },

  /** Full-width section */
  fullWidth: {
    xs: 12,
  },
} as const;

// ============================================================================
// Form Layouts
// ============================================================================

export const formLayouts = {
  /** Standard form with two columns on larger screens */
  standard: {
    container: {
      spacing: { xs: 2, md: 3 },
    },
    field: gridConfigs.formField,
    fieldFull: gridConfigs.formFieldFull,
  },

  /** Compact form - single column */
  compact: {
    container: {
      spacing: 2,
    },
    field: { xs: 12 },
  },
} as const;
