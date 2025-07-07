// src/components/ui/FormDialog.tsx
import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  SxProps,
  Theme,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface FormDialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  fullWidth?: boolean;
  disableClose?: boolean;
  sx?: SxProps<Theme>;
}

/**
 * Wiederverwendbarer Dialog-Wrapper für Formulare und modale Inhalte
 */
const FormDialog: React.FC<FormDialogProps> = ({
  open,
  onClose,
  title,
  children,
  actions,
  maxWidth = 'sm',
  fullWidth = true,
  disableClose = false,
  sx,
}) => (
  <Dialog
    open={open}
    onClose={disableClose ? undefined : onClose}
    maxWidth={maxWidth}
    fullWidth={fullWidth}
    sx={sx}
  >
    {title && (
      <DialogTitle sx={{ pr: 5 }}>
        {title}
        {!disableClose && (
          <IconButton
            aria-label="close"
            onClick={onClose}
            sx={{ position: 'absolute', right: 8, top: 8 }}
            size="large"
          >
            <CloseIcon />
          </IconButton>
        )}
      </DialogTitle>
    )}
    <DialogContent dividers>{children}</DialogContent>
    {actions && <DialogActions>{actions}</DialogActions>}
  </Dialog>
);

export default FormDialog;
