import React from 'react';
import CloseIcon from '@mui/icons-material/Close';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  type SxProps,
  type Theme,
} from '@mui/material';

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
    {title ? (
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
    ) : null}
    <DialogContent dividers>{children}</DialogContent>
    {actions !== undefined && <DialogActions>{actions}</DialogActions>}
  </Dialog>
);

export default FormDialog;
