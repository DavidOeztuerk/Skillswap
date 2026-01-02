/**
 * SkillImageSection - Allows users to select an image for their skill
 *
 * Options:
 * - No image (default) - Shows category letter
 * - Use profile photo - Uses user's avatar
 * - Upload new photo - Custom image upload
 */

import React, { memo, useCallback, useRef, useState } from 'react';
import {
  AccountCircle as ProfileIcon,
  AddPhotoAlternate as UploadIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  ImageNotSupported as NoImageIcon,
  PhotoCamera as PhotoCameraIcon,
} from '@mui/icons-material';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Avatar,
  Box,
  IconButton,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';

export type ImageOption = 'none' | 'profile' | 'upload';

interface SkillImageSectionProps {
  imageOption: ImageOption;
  imagePreview?: string | null;
  profilePhotoUrl?: string | null;
  loading?: boolean;
  expanded?: boolean;
  onExpandChange?: (expanded: boolean) => void;
  onImageOptionChange: (option: ImageOption) => void;
  onImageUpload: (file: File) => void;
  onImageClear: () => void;
  error?: string;
}

// Max file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);

const SkillImageSection: React.FC<SkillImageSectionProps> = memo(
  ({
    imageOption,
    imagePreview,
    profilePhotoUrl,
    loading = false,
    expanded = false,
    onExpandChange,
    onImageOptionChange,
    onImageUpload,
    onImageClear,
    error,
  }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadError, setUploadError] = useState<string | null>(null);

    const handleOptionChange = useCallback(
      (_: React.MouseEvent<HTMLElement>, newValue: ImageOption | null) => {
        if (newValue === null) return; // Don't allow deselection
        setUploadError(null);
        onImageOptionChange(newValue);

        // If upload is selected, trigger file input
        if (newValue === 'upload' && !imagePreview) {
          setTimeout(() => fileInputRef.current?.click(), 100);
        }
      },
      [onImageOptionChange, imagePreview]
    );

    const handleFileChange = useCallback(
      (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!ALLOWED_TYPES.has(file.type)) {
          setUploadError('Nur JPG, PNG, GIF oder WebP Dateien erlaubt');
          return;
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
          setUploadError('Datei zu gross. Maximum 5MB');
          return;
        }

        setUploadError(null);
        onImageUpload(file);

        // Reset input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      },
      [onImageUpload]
    );

    const handleUploadClick = useCallback(() => {
      fileInputRef.current?.click();
    }, []);

    const handleClearImage = useCallback(() => {
      setUploadError(null);
      onImageClear();
    }, [onImageClear]);

    // Determine preview image based on option
    const previewSrc =
      imageOption === 'profile' ? profilePhotoUrl : imageOption === 'upload' ? imagePreview : null;

    return (
      <Accordion
        expanded={expanded}
        onChange={(_, isExpanded) => onExpandChange?.(isExpanded)}
        sx={{ mb: 2 }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PhotoCameraIcon color="action" />
            <Typography variant="subtitle1" fontWeight={500}>
              Skill-Bild
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
              (optional)
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={2}>
            {/* Option Selection */}
            <ToggleButtonGroup
              value={imageOption}
              exclusive
              onChange={handleOptionChange}
              disabled={loading}
              sx={{ width: '100%' }}
            >
              <ToggleButton
                value="none"
                sx={{
                  flex: 1,
                  py: 1.5,
                  flexDirection: 'column',
                  gap: 0.5,
                }}
              >
                <NoImageIcon />
                <Typography variant="caption">Kein Bild</Typography>
              </ToggleButton>
              <ToggleButton
                value="profile"
                sx={{
                  flex: 1,
                  py: 1.5,
                  flexDirection: 'column',
                  gap: 0.5,
                }}
                disabled={!profilePhotoUrl}
              >
                <ProfileIcon />
                <Typography variant="caption">Profilfoto</Typography>
              </ToggleButton>
              <ToggleButton
                value="upload"
                sx={{
                  flex: 1,
                  py: 1.5,
                  flexDirection: 'column',
                  gap: 0.5,
                }}
              >
                <UploadIcon />
                <Typography variant="caption">Hochladen</Typography>
              </ToggleButton>
            </ToggleButtonGroup>

            {/* Description based on selection */}
            <Typography variant="body2" color="text.secondary">
              {imageOption === 'none' &&
                'Es wird der Kategorie-Buchstabe als Platzhalter angezeigt.'}
              {imageOption === 'profile' &&
                (profilePhotoUrl
                  ? 'Dein Profilfoto wird für diesen Skill verwendet.'
                  : 'Kein Profilfoto vorhanden. Lade zuerst ein Profilfoto in deinem Profil hoch.')}
              {imageOption === 'upload' && 'Lade ein eigenes Bild für diesen Skill hoch.'}
            </Typography>

            {/* Error messages */}
            {(uploadError ?? error) ? (
              <Alert severity="error" sx={{ py: 0 }}>
                {uploadError ?? error}
              </Alert>
            ) : null}

            {/* Image Preview */}
            {previewSrc ? (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  p: 2,
                  bgcolor: 'action.hover',
                  borderRadius: 1,
                }}
              >
                <Avatar
                  src={previewSrc}
                  alt="Skill-Bild Vorschau"
                  sx={{ width: 80, height: 80 }}
                  variant="rounded"
                />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" fontWeight={500}>
                    {imageOption === 'profile' ? 'Profilfoto' : 'Hochgeladenes Bild'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Vorschau des Skill-Bildes
                  </Typography>
                </Box>
                {imageOption === 'upload' ? (
                  <Stack direction="row" spacing={1}>
                    <Tooltip title="Anderes Bild hochladen">
                      <IconButton onClick={handleUploadClick} size="small">
                        <UploadIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Bild entfernen">
                      <IconButton onClick={handleClearImage} size="small" color="error">
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                ) : null}
              </Box>
            ) : null}

            {/* Upload prompt when upload selected but no image yet */}
            {imageOption === 'upload' && imagePreview == null && (
              <Box
                onClick={handleUploadClick}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 1,
                  p: 3,
                  border: 2,
                  borderStyle: 'dashed',
                  borderColor: 'divider',
                  borderRadius: 1,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    borderColor: 'primary.main',
                    bgcolor: 'action.hover',
                  },
                }}
              >
                <UploadIcon sx={{ fontSize: 48, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  Klicken zum Hochladen
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  JPG, PNG, GIF oder WebP (max. 5MB)
                </Typography>
              </Box>
            )}

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </Stack>
        </AccordionDetails>
      </Accordion>
    );
  }
);

SkillImageSection.displayName = 'SkillImageSection';

export default SkillImageSection;
