import React, { useState, useMemo, useCallback } from 'react';
import { Star, Send, ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
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
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  type SxProps,
  type Theme,
} from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../../core/store/store.hooks';
import { setShowRatingForm } from '../store/sessionsSlice';
import { rateSession } from '../store/sessionsThunks';
import type { RootState } from '../../../core/store/store';
import type { RateSessionRequest } from '../services/sessionService';

// ============================================================================
// TYPES & CONSTANTS
// ============================================================================

interface ReviewSection {
  key: 'knowledge' | 'teaching' | 'communication' | 'reliability';
  title: string;
  description: string;
  icon: string;
}

const REVIEW_SECTIONS: ReviewSection[] = [
  {
    key: 'knowledge',
    title: 'Wissen & Fachkompetenz',
    description: 'Wie gut war das Fachwissen des Lehrers?',
    icon: '\uD83C\uDFAF',
  },
  {
    key: 'teaching',
    title: 'Unterrichtsqualität',
    description: 'Wie verständlich wurde erklärt?',
    icon: '\uD83D\uDCDA',
  },
  {
    key: 'communication',
    title: 'Kommunikation',
    description: 'Wie war die Kommunikation und Freundlichkeit?',
    icon: '\uD83D\uDCAC',
  },
  {
    key: 'reliability',
    title: 'Zuverlässigkeit',
    description: 'War der Lehrer pünktlich und gut vorbereitet?',
    icon: '\u2705',
  },
];

const MAX_COMMENT_LENGTH = 500;

// ============================================================================
// STYLES
// ============================================================================

const contentStackSx: SxProps<Theme> = {
  mt: 1,
};

const sectionHeaderSx: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  gap: 1,
};

const ratingSx: SxProps<Theme> = {
  '& .MuiRating-iconFilled': {
    color: 'primary.main',
  },
};

const overallRatingSx: SxProps<Theme> = {
  p: 2,
  bgcolor: 'action.hover',
  borderRadius: 1,
  textAlign: 'center',
};

// ============================================================================
// SECTION RATING STATE
// ============================================================================

interface SectionRatingState {
  rating: number | null;
  comment: string;
}

type SectionRatings = Record<ReviewSection['key'], SectionRatingState>;

const initialSectionRatings: SectionRatings = {
  knowledge: { rating: null, comment: '' },
  teaching: { rating: null, comment: '' },
  communication: { rating: null, comment: '' },
  reliability: { rating: null, comment: '' },
};

// ============================================================================
// COMPONENT
// ============================================================================

interface RatingFormProps {
  appointmentId: string;
  participantName: string;
  open?: boolean;
  onClose?: () => void;
  onSuccess?: () => void;
}

const RatingForm: React.FC<RatingFormProps> = ({
  appointmentId,
  participantName,
  open = true,
  onClose,
  onSuccess,
}) => {
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state: RootState) => state.sessions);

  // Section ratings state
  const [sectionRatings, setSectionRatings] = useState<SectionRatings>(initialSectionRatings);

  // Overall feedback state
  const [feedback, setFeedback] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [wouldRecommend, setWouldRecommend] = useState(true);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Calculate overall rating from section ratings
  const overallRating = useMemo(() => {
    const ratings = Object.values(sectionRatings)
      .map((s) => s.rating)
      .filter((r): r is number => r !== null);

    if (ratings.length === 0) return null;
    return Math.round((ratings.reduce((sum, r) => sum + r, 0) / ratings.length) * 10) / 10;
  }, [sectionRatings]);

  // Check if at least one section is rated
  const hasAnyRating = useMemo(
    () => Object.values(sectionRatings).some((s) => s.rating !== null),
    [sectionRatings]
  );

  // Handle section rating change
  const handleSectionRatingChange = useCallback(
    (key: ReviewSection['key']) =>
      (_event: React.SyntheticEvent, value: number | null): void => {
        setSectionRatings((prev) => ({
          ...prev,
          [key]: { ...prev[key], rating: value },
        }));
        setValidationError(null);
      },
    []
  );

  // Handle section comment change
  const handleSectionCommentChange = useCallback(
    (key: ReviewSection['key']) =>
      (e: React.ChangeEvent<HTMLTextAreaElement>): void => {
        const { value } = e.target;
        if (value.length <= MAX_COMMENT_LENGTH) {
          setSectionRatings((prev) => ({
            ...prev,
            [key]: { ...prev[key], comment: value },
          }));
        }
      },
    []
  );

  // Handle overall feedback change
  const handleFeedbackChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>): void => {
    const { value } = e.target;
    if (value.length <= 2000) {
      setFeedback(value);
    }
  }, []);

  // Reset form
  const resetForm = useCallback((): void => {
    setSectionRatings(initialSectionRatings);
    setFeedback('');
    setIsPublic(true);
    setWouldRecommend(true);
    setValidationError(null);
  }, []);

  // Handle close
  const handleClose = useCallback((): void => {
    resetForm();
    dispatch(setShowRatingForm(false));
    onClose?.();
  }, [resetForm, dispatch, onClose]);

  // Handle submit
  const handleSubmit = useCallback(async (): Promise<void> => {
    // Validation: At least one section must be rated
    if (!hasAnyRating || overallRating === null) {
      setValidationError('Bitte bewerte mindestens eine Kategorie');
      return;
    }

    const request: RateSessionRequest = {
      rating: Math.round(overallRating),
      feedback: feedback.trim() || null,
      isPublic,
      wouldRecommend,
      tags: null,
      // Section ratings
      knowledgeRating: sectionRatings.knowledge.rating,
      knowledgeComment: sectionRatings.knowledge.comment.trim() || null,
      teachingRating: sectionRatings.teaching.rating,
      teachingComment: sectionRatings.teaching.comment.trim() || null,
      communicationRating: sectionRatings.communication.rating,
      communicationComment: sectionRatings.communication.comment.trim() || null,
      reliabilityRating: sectionRatings.reliability.rating,
      reliabilityComment: sectionRatings.reliability.comment.trim() || null,
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
  }, [
    hasAnyRating,
    overallRating,
    feedback,
    isPublic,
    wouldRecommend,
    sectionRatings,
    dispatch,
    appointmentId,
    handleClose,
    onSuccess,
  ]);

  // Render star labels
  const getStarLabel = (value: number | null): string => {
    if (value === null) return 'Nicht bewertet';
    const labels: Record<number, string> = {
      1: 'Mangelhaft',
      2: 'Ausreichend',
      3: 'Befriedigend',
      4: 'Gut',
      5: 'Sehr gut',
    };
    return labels[value] ?? '';
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth scroll="paper">
      <DialogTitle>Session bewerten</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={3} sx={contentStackSx}>
          {error ? (
            <Alert severity="error">
              {error.message ?? 'Bewertung konnte nicht gespeichert werden'}
            </Alert>
          ) : null}

          {validationError ? <Alert severity="warning">{validationError}</Alert> : null}

          {/* Participant Name */}
          <Box>
            <Typography variant="body2" color="text.secondary">
              Bewertung für
            </Typography>
            <Typography variant="h6" fontWeight="bold">
              {participantName}
            </Typography>
          </Box>

          <Divider />

          {/* Overall Rating Display */}
          <Box sx={overallRatingSx}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Gesamtbewertung (berechnet)
            </Typography>
            <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
              <Rating
                value={overallRating}
                readOnly
                precision={0.5}
                size="large"
                icon={<Star fontSize="inherit" />}
                emptyIcon={<Star fontSize="inherit" sx={{ opacity: 0.3 }} />}
              />
              <Typography variant="h5" fontWeight="bold" color="primary">
                {overallRating?.toFixed(1) ?? '-'}
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary">
              Durchschnitt aus allen bewerteten Kategorien
            </Typography>
          </Box>

          <Divider />

          {/* Section Ratings */}
          <Typography variant="subtitle1" fontWeight="bold">
            Bewerte die einzelnen Kategorien
          </Typography>

          {REVIEW_SECTIONS.map((section) => (
            <Accordion key={section.key} defaultExpanded disableGutters elevation={0}>
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{
                  bgcolor:
                    sectionRatings[section.key].rating === null ? 'transparent' : 'action.selected',
                  borderRadius: 1,
                }}
              >
                <Box sx={sectionHeaderSx}>
                  <Typography component="span" sx={{ fontSize: '1.2rem' }}>
                    {section.icon}
                  </Typography>
                  <Box>
                    <Typography fontWeight="medium">{section.title}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {section.description}
                    </Typography>
                  </Box>
                  {sectionRatings[section.key].rating === null ? null : (
                    <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Star sx={{ color: 'primary.main', fontSize: '1rem' }} />
                      <Typography variant="body2" fontWeight="bold" color="primary">
                        {sectionRatings[section.key].rating}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Stack spacing={2}>
                  <Box>
                    <Rating
                      value={sectionRatings[section.key].rating}
                      onChange={handleSectionRatingChange(section.key)}
                      size="large"
                      sx={ratingSx}
                      icon={<Star fontSize="inherit" />}
                      emptyIcon={<Star fontSize="inherit" sx={{ opacity: 0.3 }} />}
                    />
                    <Typography variant="caption" color="text.secondary" display="block">
                      {getStarLabel(sectionRatings[section.key].rating)}
                    </Typography>
                  </Box>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    placeholder={`Optional: Was war gut oder verbesserungswürdig bei "${section.title}"?`}
                    value={sectionRatings[section.key].comment}
                    onChange={handleSectionCommentChange(section.key)}
                    helperText={`${sectionRatings[section.key].comment.length}/${MAX_COMMENT_LENGTH}`}
                    variant="outlined"
                    size="small"
                  />
                </Stack>
              </AccordionDetails>
            </Accordion>
          ))}

          <Divider />

          {/* Overall Feedback */}
          <Box>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Allgemeines Feedback (optional)
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={3}
              placeholder="Teile deine allgemeinen Erfahrungen mit dieser Session..."
              value={feedback}
              onChange={handleFeedbackChange}
              helperText={`${feedback.length}/2000 Zeichen`}
              variant="outlined"
            />
          </Box>

          {/* Options */}
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
              label="Bewertung öffentlich anzeigen"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={wouldRecommend}
                  onChange={(e) => {
                    setWouldRecommend(e.target.checked);
                  }}
                />
              }
              label="Ich würde diese Person weiterempfehlen"
            />
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <MuiButton variant="outlined" onClick={handleClose} disabled={isLoading}>
          Abbrechen
        </MuiButton>
        <MuiButton
          variant="contained"
          onClick={handleSubmit}
          disabled={!hasAnyRating || isLoading}
          endIcon={isLoading ? <CircularProgress size={20} /> : <Send />}
        >
          Bewertung absenden
        </MuiButton>
      </DialogActions>
    </Dialog>
  );
};

export default RatingForm;
