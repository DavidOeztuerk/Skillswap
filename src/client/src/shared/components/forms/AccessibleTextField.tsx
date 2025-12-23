import React, { useId } from 'react';
import { TextField, type TextFieldProps, FormHelperText, Box } from '@mui/material';

interface AccessibleTextFieldProps extends Omit<TextFieldProps, 'helperText'> {
  helperText?: string;
  errorText?: string;
  description?: string;
  required?: boolean;
  showRequiredIndicator?: boolean;
}

/**
 * Enhanced TextField component with improved accessibility features
 * Provides proper ARIA associations, required field indicators, and screen reader support
 */
const AccessibleTextField: React.FC<AccessibleTextFieldProps> = ({
  helperText,
  errorText,
  description,
  required = false,
  showRequiredIndicator = true,
  label,
  error,
  ...props
}) => {
  const fieldId = useId();
  const descriptionId = description ? `${fieldId}-description` : undefined;
  const errorId = errorText ? `${fieldId}-error` : undefined;
  const helperId = helperText ? `${fieldId}-helper` : undefined;

  // Build aria-describedby string
  const ariaDescribedBy = [descriptionId, errorId, helperId].filter(Boolean).join(' ') || undefined;

  // Enhanced label with required indicator
  const enhancedLabel =
    label === undefined ? undefined : (
      <Box component="span">
        {label}
        {required && showRequiredIndicator ? (
          <Box
            component="span"
            sx={{
              color: 'error.main',
              ml: 0.5,
              fontWeight: 'bold',
            }}
            aria-label=" (required)"
          >
            *
          </Box>
        ) : null}
      </Box>
    );

  return (
    <Box>
      <TextField
        {...props}
        id={fieldId}
        label={enhancedLabel}
        required={required}
        error={error ?? !!errorText}
        aria-describedby={ariaDescribedBy}
        aria-invalid={error ?? !!errorText}
        slotProps={{
          htmlInput: {
            'aria-required': required,
            'aria-invalid': error ?? !!errorText,
          },
        }}
      />

      {/* Description text */}
      {description ? (
        <FormHelperText
          id={descriptionId}
          sx={{
            mt: 1,
            color: 'text.secondary',
            fontSize: '0.75rem',
          }}
        >
          {description}
        </FormHelperText>
      ) : null}

      {/* Error message */}
      {errorText ? (
        <FormHelperText
          id={errorId}
          error
          sx={{
            mt: 1,
            fontSize: '0.75rem',
          }}
          role="alert"
          aria-live="polite"
        >
          {errorText}
        </FormHelperText>
      ) : null}

      {/* Helper text */}
      {helperText && !errorText ? (
        <FormHelperText
          id={helperId}
          sx={{
            mt: 1,
            color: 'text.secondary',
            fontSize: '0.75rem',
          }}
        >
          {helperText}
        </FormHelperText>
      ) : null}
    </Box>
  );
};

export default AccessibleTextField;
