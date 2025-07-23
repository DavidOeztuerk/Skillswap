// src/components/accessibility/FocusTrap.tsx
import React, { useEffect, useRef, ReactNode } from 'react';

interface FocusTrapProps {
  children: ReactNode;
  active: boolean;
  onEscape?: () => void;
  restoreFocus?: boolean;
  initialFocusRef?: React.RefObject<HTMLElement>;
}

/**
 * Focus trap component for modal dialogs and other contained interactions
 * Ensures keyboard users stay within the modal and can't tab out
 */
const FocusTrap: React.FC<FocusTrapProps> = ({
  children,
  active,
  onEscape,
  restoreFocus = true,
  initialFocusRef,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Get all focusable elements within the container
  const getFocusableElements = (): HTMLElement[] => {
    if (!containerRef.current) return [];

    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]',
    ].join(', ');

    return Array.from(
      containerRef.current.querySelectorAll<HTMLElement>(focusableSelectors)
    ).filter((element) => {
      // Filter out hidden elements
      const style = window.getComputedStyle(element);
      return (
        style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        element.offsetWidth > 0 &&
        element.offsetHeight > 0
      );
    });
  };

  // Handle keydown events for focus trapping
  const handleKeyDown = (event: KeyboardEvent) => {
    if (!active) return;

    if (event.key === 'Escape' && onEscape) {
      event.preventDefault();
      onEscape();
      return;
    }

    if (event.key !== 'Tab') return;

    const focusableElements = getFocusableElements();
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    const currentElement = document.activeElement as HTMLElement;

    if (event.shiftKey) {
      // Shift + Tab (backward)
      if (currentElement === firstElement || !focusableElements.includes(currentElement)) {
        event.preventDefault();
        lastElement.focus();
      }
    } else {
      // Tab (forward)
      if (currentElement === lastElement || !focusableElements.includes(currentElement)) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  };

  useEffect(() => {
    if (active) {
      // Store the currently focused element
      previousActiveElement.current = document.activeElement as HTMLElement;

      // Add event listener for keydown
      document.addEventListener('keydown', handleKeyDown);

      // Focus the initial element or first focusable element
      const focusElement = () => {
        if (initialFocusRef?.current) {
          initialFocusRef.current.focus();
        } else {
          const focusableElements = getFocusableElements();
          if (focusableElements.length > 0) {
            focusableElements[0].focus();
          }
        }
      };

      // Use setTimeout to ensure the element is rendered
      setTimeout(focusElement, 0);

      return () => {
        document.removeEventListener('keydown', handleKeyDown);

        // Restore focus to the previously focused element
        if (restoreFocus && previousActiveElement.current) {
          previousActiveElement.current.focus();
        }
      };
    }
  }, [active, restoreFocus, initialFocusRef]);

  return (
    <div ref={containerRef} style={{ outline: 'none' }}>
      {children}
    </div>
  );
};

export default FocusTrap;