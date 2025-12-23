// src/utils/accessibility.ts

/**
 * Accessibility utility functions for the SkillSwap application
 */

/**
 * Generate a unique ID for accessibility attributes
 */
export const generateA11yId = (prefix = 'a11y'): string =>
  `${prefix}-${Math.random().toString(36).slice(2, 11)}`;

/**
 * Check if an element is visible to screen readers
 */
export const isVisibleToScreenReader = (element: HTMLElement): boolean => {
  const style = window.getComputedStyle(element);
  return !(
    style.display === 'none' ||
    style.visibility === 'hidden' ||
    style.opacity === '0' ||
    element.hasAttribute('aria-hidden') ||
    element.offsetWidth === 0 ||
    element.offsetHeight === 0
  );
};

/**
 * Get all focusable elements within a container
 */
export const getFocusableElements = (container: HTMLElement): HTMLElement[] => {
  const focusableSelectors = [
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'a[href]',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]',
    'details[open] summary',
  ].join(', ');

  return [...container.querySelectorAll<HTMLElement>(focusableSelectors)].filter(
    isVisibleToScreenReader
  );
};

/**
 * Set focus to the first focusable element in a container
 */
export const focusFirstElement = (container: HTMLElement): boolean => {
  const focusableElements = getFocusableElements(container);
  if (focusableElements.length > 0) {
    focusableElements[0].focus();
    return true;
  }
  return false;
};

/**
 * Set focus to the last focusable element in a container
 */
export const focusLastElement = (container: HTMLElement): boolean => {
  const focusableElements = getFocusableElements(container);
  if (focusableElements.length > 0) {
    // eslint-disable-next-line unicorn/prefer-at
    focusableElements[focusableElements.length - 1].focus();
    return true;
  }
  return false;
};

/**
 * Trap focus within a container (for modals, dialogs, etc.)
 */
export const trapFocus = (container: HTMLElement, onEscape?: () => void): (() => void) => {
  const handleKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape' && onEscape) {
      onEscape();
      return;
    }

    if (event.key !== 'Tab') return;

    const focusableElements = getFocusableElements(container);
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    // eslint-disable-next-line unicorn/prefer-at
    const lastElement = focusableElements[focusableElements.length - 1];
    const currentElement = document.activeElement as HTMLElement;

    if (event.shiftKey) {
      // Shift + Tab (backward)
      if (currentElement === firstElement || !focusableElements.includes(currentElement)) {
        event.preventDefault();
        lastElement.focus();
      }
    } else if (currentElement === lastElement || !focusableElements.includes(currentElement)) {
      // Tab (forward)
      event.preventDefault();
      firstElement.focus();
    }
  };

  document.addEventListener('keydown', handleKeyDown);

  // Return cleanup function
  return () => {
    document.removeEventListener('keydown', handleKeyDown);
  };
};

/**
 * Announce text to screen readers
 */
export const announceToScreenReader = (
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
): void => {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.style.position = 'absolute';
  announcement.style.left = '-10000px';
  announcement.style.width = '1px';
  announcement.style.height = '1px';
  announcement.style.overflow = 'hidden';

  document.body.append(announcement);
  announcement.textContent = message;

  // Remove after announcement
  setTimeout(() => {
    announcement.remove();
  }, 1000);
};

/**
 * Check if user prefers reduced motion
 */
export const prefersReducedMotion = (): boolean =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Check color contrast ratio
 */
export const getContrastRatio = (color1: string, color2: string): number => {
  const getLuminance = (color: string): number => {
    // Simple approximation - in production, use a proper color library
    const rgb = color.match(/\d+/g);
    if (rgb === null || rgb.length < 3) return 0;

    const [r, g, b] = rgb.map((val) => {
      const num = Number.parseInt(val, 10) / 255;
      return num <= 0.03928 ? num / 12.92 : ((num + 0.055) / 1.055) ** 2.4;
    });

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);

  return (brightest + 0.05) / (darkest + 0.05);
};

/**
 * Check if contrast ratio meets WCAG AA standards
 */
export const meetsContrastRequirement = (
  color1: string,
  color2: string,
  level: 'AA' | 'AAA' = 'AA',
  isLargeText = false
): boolean => {
  const ratio = getContrastRatio(color1, color2);

  if (level === 'AAA') {
    return isLargeText ? ratio >= 4.5 : ratio >= 7;
  }

  return isLargeText ? ratio >= 3 : ratio >= 4.5;
};

/**
 * Add role and ARIA attributes to an element
 */
export const addAriaAttributes = (
  element: HTMLElement,
  attributes: Record<string, string | boolean | null>
): void => {
  Object.entries(attributes).forEach(([key, value]) => {
    if (value === null) {
      element.removeAttribute(key);
    } else {
      element.setAttribute(key, value.toString());
    }
  });
};

/**
 * Create a live region for announcements
 */
export const createLiveRegion = (priority: 'polite' | 'assertive' = 'polite'): HTMLElement => {
  const liveRegion = document.createElement('div');
  liveRegion.setAttribute('aria-live', priority);
  liveRegion.setAttribute('aria-atomic', 'true');
  liveRegion.style.position = 'absolute';
  liveRegion.style.left = '-10000px';
  liveRegion.style.width = '1px';
  liveRegion.style.height = '1px';
  liveRegion.style.overflow = 'hidden';
  liveRegion.style.clipPath = 'inset(50%)';
  liveRegion.style.whiteSpace = 'nowrap';

  document.body.append(liveRegion);
  return liveRegion;
};

/**
 * Screen reader utility class for managing announcements
 */
export class ScreenReaderAnnouncer {
  private politeRegion: HTMLElement;
  private assertiveRegion: HTMLElement;

  constructor() {
    this.politeRegion = createLiveRegion('polite');
    this.assertiveRegion = createLiveRegion('assertive');
  }

  announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    const region = priority === 'assertive' ? this.assertiveRegion : this.politeRegion;

    // Clear and set new message
    region.textContent = '';
    setTimeout(() => {
      region.textContent = message;

      // Auto-clear after 5 seconds
      setTimeout(() => {
        if (region.textContent === message) {
          region.textContent = '';
        }
      }, 5000);
    }, 100);
  }

  clear(): void {
    this.politeRegion.textContent = '';
    this.assertiveRegion.textContent = '';
  }

  destroy(): void {
    this.politeRegion.remove();
    this.assertiveRegion.remove();
  }
}

/**
 * Keyboard navigation utilities
 */
export const KeyboardNavigation = {
  /**
   * Handle arrow key navigation in a list
   */
  handleArrowKeys: (
    event: KeyboardEvent,
    elements: HTMLElement[],
    currentIndex: number,
    onSelect?: (index: number) => void
  ): number => {
    let newIndex = currentIndex;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        newIndex = (currentIndex + 1) % elements.length;
        break;
      case 'ArrowUp':
        event.preventDefault();
        newIndex = currentIndex === 0 ? elements.length - 1 : currentIndex - 1;
        break;
      case 'Home':
        event.preventDefault();
        newIndex = 0;
        break;
      case 'End':
        event.preventDefault();
        newIndex = elements.length - 1;
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (onSelect) {
          onSelect(currentIndex);
        }
        return currentIndex;
      default:
        // No action needed for other keys
        break;
    }

    if (newIndex !== currentIndex) {
      elements[newIndex].focus();
    }

    return newIndex;
  },

  /**
   * Handle grid navigation (2D arrow keys)
   */
  handleGridNavigation: (
    event: KeyboardEvent,
    gridElements: HTMLElement[][],
    currentRow: number,
    currentCol: number
  ): { row: number; col: number } => {
    let newRow = currentRow;
    let newCol = currentCol;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        newRow = Math.min(currentRow + 1, gridElements.length - 1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        newRow = Math.max(currentRow - 1, 0);
        break;
      case 'ArrowRight':
        event.preventDefault();
        newCol = Math.min(currentCol + 1, (gridElements[currentRow]?.length ?? 1) - 1);
        break;
      case 'ArrowLeft':
        event.preventDefault();
        newCol = Math.max(currentCol - 1, 0);
        break;
      default:
        // No action needed for other keys
        break;
    }

    // Ensure the new position is valid
    gridElements[newRow][newCol].focus();

    return { row: newRow, col: newCol };
  },
};
