import React, { memo, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  IconButton,
  Typography,
  Box,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string | React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmColor?: 'inherit' | 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning';
  fullWidth?: boolean;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  disableBackdropClick?: boolean;
  disableEscapeKeyDown?: boolean;
  showCloseButton?: boolean;
}

/**
 * Standardisierter Bestätigungsdialog mit anpassbaren Texten und Aktionen
 */
const ConfirmDialog: React.FC<ConfirmDialogProps> = memo(
  ({
    open,
    title,
    message,
    confirmLabel = 'Bestätigen',
    cancelLabel = 'Abbrechen',
    onConfirm,
    onCancel,
    confirmColor = 'primary',
    fullWidth = true,
    maxWidth = 'sm',
    disableBackdropClick = false,
    disableEscapeKeyDown = false,
    showCloseButton = true,
  }) => {
    const handleClose = useCallback(
      (_: object, reason: 'backdropClick' | 'escapeKeyDown') => {
        if (
          (reason === 'backdropClick' && disableBackdropClick) ||
          (reason === 'escapeKeyDown' && disableEscapeKeyDown)
        ) {
          return;
        }
        onCancel();
      },
      [disableBackdropClick, disableEscapeKeyDown, onCancel]
    );

    return (
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
        fullWidth={fullWidth}
        maxWidth={maxWidth}
        disableEscapeKeyDown={disableEscapeKeyDown}
      >
        <DialogTitle id="confirm-dialog-title">
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="h6" component="div">
              {title}
            </Typography>
            {showCloseButton && (
              <IconButton aria-label="close" onClick={onCancel} size="small">
                <CloseIcon />
              </IconButton>
            )}
          </Box>
        </DialogTitle>
        <DialogContent>
          {typeof message === 'string' ? (
            <DialogContentText id="confirm-dialog-description">{message}</DialogContentText>
          ) : (
            message
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onCancel} color="inherit">
            {cancelLabel}
          </Button>
          <Button onClick={onConfirm} color={confirmColor} variant="contained">
            {confirmLabel}
          </Button>
        </DialogActions>
      </Dialog>
    );
  }
);

ConfirmDialog.displayName = 'ConfirmDialog';

export default ConfirmDialog;
