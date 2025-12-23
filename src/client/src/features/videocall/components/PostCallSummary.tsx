import React, { useState, useCallback, memo } from 'react';
import {
  Check as CheckIcon,
  AccessTime as TimeIcon,
  Videocam as VideocamIcon,
  Star as StarIcon,
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
  Report as ReportIcon,
} from '@mui/icons-material';
import {
  Box,
  Typography,
  Button,
  Paper,
  Avatar,
  Stack,
  Rating,
  TextField,
  Chip,
  Divider,
  Alert,
  CircularProgress,
  type SxProps,
  type Theme,
} from '@mui/material';
import { formatDuration } from '../../../shared/utils/formatters';

const pageContainerSx: SxProps<Theme> = {
  minHeight: '100vh',
  bgcolor: 'background.default',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  p: 3,
};

const successPaperSx: SxProps<Theme> = {
  maxWidth: 500,
  width: '100%',
  p: 4,
  borderRadius: 3,
  textAlign: 'center',
};

const successIconContainerSx: SxProps<Theme> = {
  width: 80,
  height: 80,
  borderRadius: '50%',
  bgcolor: 'success.main',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  mx: 'auto',
  mb: 3,
};

const successIconSx: SxProps<Theme> = {
  fontSize: 48,
  color: 'white',
};

const mainPaperSx: SxProps<Theme> = {
  maxWidth: 600,
  width: '100%',
  p: 4,
  borderRadius: 3,
};

const headerSx: SxProps<Theme> = {
  textAlign: 'center',
  mb: 3,
};

const headerIconSx: SxProps<Theme> = {
  fontSize: 48,
  color: 'success.main',
  mb: 2,
};

const callStatsSx: SxProps<Theme> = {
  p: 2,
  mb: 3,
  bgcolor: 'grey.50',
  borderRadius: 2,
};

const participantAvatarSx: SxProps<Theme> = {
  width: 40,
  height: 40,
};

const ratingSectionSx: SxProps<Theme> = {
  mb: 4,
};

const ratingContainerSx: SxProps<Theme> = {
  display: 'flex',
  justifyContent: 'center',
  mb: 2,
};

const reportIssueSx: SxProps<Theme> = {
  mt: 3,
  textAlign: 'center',
};

// ============================================================================
// Types
// ============================================================================

interface PostCallSummaryProps {
  appointmentId: string;
  appointmentTitle?: string;
  otherPartyName: string;
  otherPartyAvatarUrl?: string;
  callDuration: number; // in seconds
  onSubmitFeedback: (feedback: CallFeedback) => Promise<void>;
  onSkip: () => void;
  onReportIssue?: () => void;
}

interface CallFeedback {
  rating: number;
  wouldRecommend: boolean | null;
  comment: string;
  tags: string[];
}

// ============================================================================
// Constants
// ============================================================================

const FEEDBACK_TAGS = [
  'Hilfreich',
  'Professionell',
  'Freundlich',
  'Gute Erklärungen',
  'Pünktlich',
  'Geduldig',
  'Kompetent',
  'Gute Vorbereitung',
];

const RATING_LABELS: Record<number, string> = {
  1: 'Nicht zufrieden',
  2: 'Verbesserungswürdig',
  3: 'Gut',
  4: 'Sehr gut!',
  5: 'Ausgezeichnet!',
};

// ============================================================================
// Component
// ============================================================================

const PostCallSummary: React.FC<PostCallSummaryProps> = memo(
  ({
    appointmentTitle = 'Skill-Austausch Session',
    otherPartyName,
    otherPartyAvatarUrl,
    callDuration,
    onSubmitFeedback,
    onSkip,
    onReportIssue,
  }) => {
    const [rating, setRating] = useState<number | null>(0);
    const [wouldRecommend, setWouldRecommend] = useState<boolean | null>(null);
    const [comment, setComment] = useState('');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [isSubmitted, setIsSubmitted] = useState(false);

    // ========================================================================
    // Handlers
    // ========================================================================

    const handleTagToggle = useCallback((tag: string) => {
      setSelectedTags((prev) =>
        prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
      );
    }, []);

    const handleSubmit = useCallback(async () => {
      if (rating === null || rating === 0) {
        setSubmitError('Bitte gib eine Bewertung ab.');
        return;
      }

      setIsSubmitting(true);
      setSubmitError(null);

      try {
        await onSubmitFeedback({
          rating,
          wouldRecommend,
          comment,
          tags: selectedTags,
        });
        setIsSubmitted(true);
      } catch {
        setSubmitError('Feedback konnte nicht gesendet werden. Bitte versuche es erneut.');
      } finally {
        setIsSubmitting(false);
      }
    }, [rating, wouldRecommend, comment, selectedTags, onSubmitFeedback]);

    // ========================================================================
    // Success State
    // ========================================================================

    if (isSubmitted) {
      return (
        <Box sx={pageContainerSx}>
          <Paper elevation={3} sx={successPaperSx}>
            <Box sx={successIconContainerSx}>
              <CheckIcon sx={successIconSx} />
            </Box>

            <Typography variant="h5" gutterBottom>
              Vielen Dank für dein Feedback!
            </Typography>

            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              Deine Bewertung hilft anderen Nutzern, den passenden Skill-Partner zu finden.
            </Typography>

            <Button variant="contained" size="large" onClick={onSkip}>
              Zurück zu den Terminen
            </Button>
          </Paper>
        </Box>
      );
    }

    // ========================================================================
    // Main Render
    // ========================================================================

    return (
      <Box sx={pageContainerSx}>
        <Paper elevation={3} sx={mainPaperSx}>
          {/* Header */}
          <Box sx={headerSx}>
            <VideocamIcon sx={headerIconSx} />
            <Typography variant="h5" gutterBottom>
              Session beendet
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {appointmentTitle}
            </Typography>
          </Box>

          {/* Call Stats */}
          <Paper variant="outlined" sx={callStatsSx}>
            <Stack direction="row" spacing={3} justifyContent="center" alignItems="center">
              <Stack direction="row" alignItems="center" spacing={1}>
                <Avatar src={otherPartyAvatarUrl} sx={participantAvatarSx}>
                  {otherPartyName[0]}
                </Avatar>
                <Typography variant="body1">{otherPartyName}</Typography>
              </Stack>
              <Divider orientation="vertical" flexItem />
              <Stack direction="row" alignItems="center" spacing={1}>
                <TimeIcon color="action" />
                <Typography variant="body1">{formatDuration(callDuration)}</Typography>
              </Stack>
            </Stack>
          </Paper>

          <Divider sx={{ my: 3 }} />

          {/* Rating Section */}
          <Box sx={ratingSectionSx}>
            <Typography variant="h6" gutterBottom sx={{ textAlign: 'center' }}>
              Wie war deine Erfahrung?
            </Typography>
            <Box sx={ratingContainerSx}>
              <Rating
                value={rating}
                onChange={(_, newValue) => {
                  setRating(newValue);
                }}
                size="large"
                icon={<StarIcon fontSize="inherit" sx={{ color: 'warning.main' }} />}
                emptyIcon={<StarIcon fontSize="inherit" />}
              />
            </Box>
            {rating !== null && rating > 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                {RATING_LABELS[rating]}
              </Typography>
            ) : null}
          </Box>

          {/* Would Recommend */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle1" gutterBottom sx={{ textAlign: 'center' }}>
              Würdest du {otherPartyName} weiterempfehlen?
            </Typography>
            <Stack direction="row" spacing={2} justifyContent="center">
              <Button
                variant={wouldRecommend === true ? 'contained' : 'outlined'}
                color="success"
                startIcon={<ThumbUpIcon />}
                onClick={() => {
                  setWouldRecommend(true);
                }}
              >
                Ja
              </Button>
              <Button
                variant={wouldRecommend === false ? 'contained' : 'outlined'}
                color="error"
                startIcon={<ThumbDownIcon />}
                onClick={() => {
                  setWouldRecommend(false);
                }}
              >
                Nein
              </Button>
            </Stack>
          </Box>

          {/* Tags */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle1" gutterBottom>
              Was hat dir gefallen? (optional)
            </Typography>
            <Stack direction="row" flexWrap="wrap" gap={1}>
              {FEEDBACK_TAGS.map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  onClick={() => {
                    handleTagToggle(tag);
                  }}
                  color={selectedTags.includes(tag) ? 'primary' : 'default'}
                  variant={selectedTags.includes(tag) ? 'filled' : 'outlined'}
                  sx={{ cursor: 'pointer' }}
                />
              ))}
            </Stack>
          </Box>

          {/* Comment */}
          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Kommentar (optional)"
              placeholder="Teile deine Erfahrung mit anderen Nutzern..."
              value={comment}
              onChange={(e) => {
                setComment(e.target.value);
              }}
            />
          </Box>

          {/* Error Message */}
          {submitError ? (
            <Alert severity="error" sx={{ mb: 3 }}>
              {submitError}
            </Alert>
          ) : null}

          {/* Actions */}
          <Stack spacing={2}>
            <Button
              variant="contained"
              size="large"
              fullWidth
              onClick={handleSubmit}
              disabled={isSubmitting}
              startIcon={isSubmitting ? <CircularProgress size={20} /> : undefined}
            >
              {isSubmitting ? 'Wird gesendet...' : 'Feedback senden'}
            </Button>
            <Button variant="text" size="large" fullWidth onClick={onSkip} disabled={isSubmitting}>
              Überspringen
            </Button>
          </Stack>

          {/* Report Issue Link */}
          {onReportIssue ? (
            <Box sx={reportIssueSx}>
              <Button
                variant="text"
                color="error"
                size="small"
                startIcon={<ReportIcon />}
                onClick={onReportIssue}
              >
                Problem melden
              </Button>
            </Box>
          ) : null}
        </Paper>
      </Box>
    );
  }
);

PostCallSummary.displayName = 'PostCallSummary';

export default PostCallSummary;
