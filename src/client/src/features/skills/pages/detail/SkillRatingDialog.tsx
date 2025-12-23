/**
 * SkillRatingDialog Component
 *
 * Dialog for rating a skill with optional review text.
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  TextField,
  Button,
  Rating,
} from '@mui/material';
import type { SkillRatingDialogProps } from '../../types/types';

export const SkillRatingDialog: React.FC<SkillRatingDialogProps> = ({
  open,
  onClose,
  onSubmit,
}) => {
  const [rating, setRating] = useState<number | null>(0);
  const [review, setReview] = useState('');

  const handleSubmit = (): void => {
    if (rating !== null && rating > 0) {
      onSubmit(rating, review);
      setRating(0);
      setReview('');
    }
  };

  const handleClose = (): void => {
    setRating(0);
    setReview('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Skill bewerten</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Typography component="legend" gutterBottom>
            Bewertung
          </Typography>
          <Rating
            value={rating}
            onChange={(_, newValue) => {
              setRating(newValue);
            }}
            size="large"
          />
        </Box>
        <TextField
          fullWidth
          multiline
          rows={4}
          label="Kommentar (optional)"
          value={review}
          onChange={(e) => {
            setReview(e.target.value);
          }}
          placeholder="Teile deine Erfahrungen mit diesem Skill..."
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Abbrechen</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={rating === null || rating === 0}
        >
          Bewertung abgeben
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SkillRatingDialog;
