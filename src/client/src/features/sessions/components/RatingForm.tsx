import React, { useState } from 'react';
import { Star, Send } from '@mui/icons-material';
import {
  Box,
  Stack,
  TextField,
  Rating,
  FormControlLabel,
  Checkbox,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button as MuiButton,
  type SxProps,
  type Theme,
} from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../../core/store/store.hooks';
import { setShowRatingForm } from '../store/sessionsSlice';
import { rateSession } from '../store/sessionsThunks';
import type { RootState } from '../../../core/store/store';
import type { RateSessionRequest } from '../services/sessionService';

// ============================================================================
// PERFORMANCE: Extract sx objects as constants to prevent recreation
// ============================================================================

const contentStackSx: SxProps<Theme> = {
  mt: 1,
};

const labelSx: SxProps<Theme> = {
  mb: 1,
  fontSize: '0.875rem',
  fontWeight: 600,
  color: 'textSecondary',
};

const ratingLabelSx: SxProps<Theme> = {
  mb: 1,
  fontSize: '0.875rem',
  fontWeight: 600,
};

const ratingHelperSx: SxProps<Theme> = {
  mt: 1,
  fontSize: '0.75rem',
  color: 'textSecondary',
};

const starIconSx: SxProps<Theme> = {
  fontSize: '2rem',
};

const emptyStarIconSx: SxProps<Theme> = {
  fontSize: '2rem',
  opacity: 0.3,
};

interface RatingFormProps {
  appointmentId: string;
  participantName: string;
  open?: boolean;
  onClose?: () => void;
  onSuccess?: () => void;
}

/**
 * RatingForm Component
 *
 * Allows users to rate completed sessions with:
 * - 1-5 star rating
 * - Optional feedback/comments
 * - Public/private rating toggle
 * - Recommendation flag
 * - Tags for categorization
 */
const RatingForm: React.FC<RatingFormProps> = ({
  appointmentId,
  participantName,
  open = true,
  onClose,
  onSuccess,
}) => {
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state: RootState) => state.sessions);

  const [rating, setRating] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [wouldRecommend, setWouldRecommend] = useState(true);
  const [tags, setTags] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleRatingChange = (_event: React.SyntheticEvent, value: number | null): void => {
    setRating(value);
    setValidationError(null);
  };

  const handleFeedbackChange = (e: React.ChangeEvent<HTMLTextAreaElement>): void => {
    const { value } = e.target;
    // Limit feedback to 2000 characters
    if (value.length <= 2000) {
      setFeedback(value);
    }
  };

  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setTags(e.target.value);
  };

  const handleClose = (): void => {
    // Reset form
    setRating(null);
    setFeedback('');
    setIsPublic(true);
    setWouldRecommend(true);
    setTags('');
    setValidationError(null);

    dispatch(setShowRatingForm(false));
    onClose?.();
  };

  const handleSubmit = async (): Promise<void> => {
    // Validation
    if (rating === null || rating < 1 || rating > 5) {
      setValidationError('Please select a rating between 1 and 5');
      return;
    }

    const request: RateSessionRequest = {
      rating,
      feedback: feedback.trim() || null,
      isPublic,
      wouldRecommend,
      tags: tags.trim() || null,
    };

    try {
      const result = await dispatch(
        rateSession({
          appointmentId,
          request,
        })
      );

      if (result.meta.requestStatus === 'fulfilled') {
        handleClose();
        onSuccess?.();
      }
    } catch (err) {
      console.error('Failed to submit rating:', err);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Rate Your Session</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={3} sx={contentStackSx}>
          {error ? (
            <Alert severity="error">{error.message ?? 'Failed to submit rating'}</Alert>
          ) : null}

          {validationError ? <Alert severity="warning">{validationError}</Alert> : null}

          {/* Participant Name */}
          <Box>
            <Box sx={labelSx}>
              Rating for: <strong>{participantName}</strong>
            </Box>
          </Box>

          {/* Star Rating */}
          <Box>
            <Box sx={ratingLabelSx}>Your Rating *</Box>
            <Rating
              value={rating}
              onChange={handleRatingChange}
              size="large"
              icon={<Star sx={starIconSx} />}
              emptyIcon={<Star sx={emptyStarIconSx} />}
            />
            <Box sx={ratingHelperSx}>
              {rating === null
                ? 'Please select a rating'
                : `You rated: ${rating} star${rating === 1 ? '' : 's'}`}
            </Box>
          </Box>

          {/* Feedback */}
          <Box>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Feedback (Optional)"
              placeholder="Share your experience with this session..."
              value={feedback}
              onChange={handleFeedbackChange}
              maxRows={6}
              helperText={`${feedback.length}/2000 characters`}
              variant="outlined"
            />
          </Box>

          {/* Public/Private Toggle */}
          <Box>
            <FormControlLabel
              control={
                <Checkbox
                  checked={isPublic}
                  onChange={(e) => {
                    setIsPublic(e.target.checked);
                  }}
                />
              }
              label="Make this rating public (visible to others)"
            />
          </Box>

          {/* Recommendation */}
          <Box>
            <FormControlLabel
              control={
                <Checkbox
                  checked={wouldRecommend}
                  onChange={(e) => {
                    setWouldRecommend(e.target.checked);
                  }}
                />
              }
              label="I would recommend this person"
            />
          </Box>

          {/* Tags */}
          <Box>
            <TextField
              fullWidth
              label="Tags (Optional)"
              placeholder="e.g., knowledgeable, friendly, punctual"
              value={tags}
              onChange={handleTagsChange}
              helperText="Comma-separated tags to help categorize this rating"
              variant="outlined"
            />
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <MuiButton variant="outlined" onClick={handleClose} disabled={isLoading}>
          Cancel
        </MuiButton>
        <MuiButton
          variant="contained"
          onClick={handleSubmit}
          disabled={rating === null || isLoading}
          endIcon={isLoading ? <CircularProgress size={20} /> : <Send />}
        >
          Submit Rating
        </MuiButton>
      </DialogActions>
    </Dialog>
  );
};

export default RatingForm;
