import React, { useState } from 'react';
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
} from '@mui/material';
import { Star, Send } from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../store/store.hooks';
import { RootState } from '../../store/store';
import { rateSession } from '../../features/sessions/sessionsThunks';
import { setShowRatingForm } from '../../features/sessions/sessionsSlice';
import { RateSessionRequest } from '../../api/services/sessionService';

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

  const handleRatingChange = (_event: React.SyntheticEvent, value: number | null) => {
    setRating(value);
    setValidationError(null);
  };

  const handleFeedbackChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    // Limit feedback to 2000 characters
    if (value.length <= 2000) {
      setFeedback(value);
    }
  };

  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTags(e.target.value);
  };

  const handleSubmit = async () => {
    // Validation
    if (!rating || rating < 1 || rating > 5) {
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

  const handleClose = () => {
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

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Rate Your Session</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={3} sx={{ mt: 1 }}>
          {error && (
            <Alert severity="error">
              {error.message || 'Failed to submit rating'}
            </Alert>
          )}

          {validationError && <Alert severity="warning">{validationError}</Alert>}

          {/* Participant Name */}
          <Box>
            <Box sx={{ mb: 1, fontSize: '0.875rem', fontWeight: 600, color: 'textSecondary' }}>
              Rating for: <strong>{participantName}</strong>
            </Box>
          </Box>

          {/* Star Rating */}
          <Box>
            <Box sx={{ mb: 1, fontSize: '0.875rem', fontWeight: 600 }}>
              Your Rating *
            </Box>
            <Rating
              value={rating}
              onChange={handleRatingChange}
              size="large"
              icon={<Star sx={{ fontSize: '2rem' }} />}
              emptyIcon={<Star sx={{ fontSize: '2rem', opacity: 0.3 }} />}
            />
            <Box sx={{ mt: 1, fontSize: '0.75rem', color: 'textSecondary' }}>
              {rating ? `You rated: ${rating} star${rating !== 1 ? 's' : ''}` : 'Please select a rating'}
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
                  onChange={(e) => setIsPublic(e.target.checked)}
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
                  onChange={(e) => setWouldRecommend(e.target.checked)}
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
          disabled={!rating || isLoading}
          endIcon={isLoading ? <CircularProgress size={20} /> : <Send />}
        >
          Submit Rating
        </MuiButton>
      </DialogActions>
    </Dialog>
  );
};

export default RatingForm;
