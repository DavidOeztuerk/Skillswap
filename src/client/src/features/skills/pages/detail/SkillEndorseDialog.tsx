/**
 * SkillEndorseDialog Component
 *
 * Dialog for endorsing/recommending a skill.
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
} from '@mui/material';
import type { SkillEndorseDialogProps } from '../../types/types';

export const SkillEndorseDialog: React.FC<SkillEndorseDialogProps> = ({
  open,
  onClose,
  onSubmit,
}) => {
  const [message, setMessage] = useState('');

  const handleSubmit = (): void => {
    onSubmit(message);
    setMessage('');
  };

  const handleClose = (): void => {
    setMessage('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Skill empfehlen</DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          multiline
          rows={4}
          label="Empfehlungstext (optional)"
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
          }}
          placeholder="Warum empfiehlst du diesen Skill?"
          sx={{ mt: 1 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Abbrechen</Button>
        <Button onClick={handleSubmit} variant="contained">
          Empfehlen
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SkillEndorseDialog;
