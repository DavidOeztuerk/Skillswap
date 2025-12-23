import type { SxProps, Theme } from '@mui/material';
import { mixins } from '../../../styles/mixins';

export const heroSectionSx: SxProps<Theme> = {
  bgcolor: 'primary.main',
  color: 'primary.contrastText',
  py: { xs: 8, md: 12 },
  position: 'relative',
  overflow: 'hidden',
};

export const heroButtonContainerSx: SxProps<Theme> = {
  mt: 4,
  display: 'flex',
  gap: 2,
  flexWrap: { xs: 'wrap', sm: 'nowrap' },
};

export const primaryButtonSx: SxProps<Theme> = {
  px: 4,
  py: 1.5,
  fontWeight: 'bold',
};

export const outlineButtonLightSx: SxProps<Theme> = {
  px: 4,
  py: 1.5,
  fontWeight: 'bold',
  borderColor: 'white',
  color: 'white',
  '&:hover': {
    borderColor: 'white',
    bgcolor: 'rgba(255, 255, 255, 0.1)',
  },
};

export const heroImageContainerSx: SxProps<Theme> = {
  position: 'relative',
  height: 400,
  width: '100%',
  bgcolor: 'background.paper',
  borderRadius: 4,
  boxShadow: 8,
  overflow: 'hidden',
};

export const heroImagePlaceholderSx: SxProps<Theme> = {
  ...mixins.flexCenter,
  height: '100%',
  width: '100%',
  bgcolor: 'rgba(255,255,255,0.1)',
  color: 'primary.main',
};

export const sectionContainerSx: SxProps<Theme> = {
  py: 8,
};

export const sectionHeaderSx: SxProps<Theme> = {
  ...mixins.flexBetween,
  mb: 4,
};

export const sectionTitleBoxSx: SxProps<Theme> = {
  ...mixins.flexCenter,
  gap: 1,
};

export const subtitleSx: SxProps<Theme> = {
  mb: 6,
  maxWidth: 800,
};

export const skillCardSx: SxProps<Theme> = {
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  cursor: 'pointer',
  transition: 'all 0.3s',
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: 6,
  },
};

export const skillCardContentSx: SxProps<Theme> = {
  flexGrow: 1,
};

export const ratingBoxSx: SxProps<Theme> = {
  ...mixins.flexCenter,
  gap: 1,
  mb: 2,
};

export const chipContainerSx: SxProps<Theme> = {
  display: 'flex',
  gap: 1,
  flexWrap: 'wrap',
};

export const cardActionsSx: SxProps<Theme> = {
  justifyContent: 'flex-end',
  p: 2,
  pt: 0,
};

export const emptyStateSx: SxProps<Theme> = {
  textAlign: 'center',
  py: 6,
};

export const ctaBoxSx: SxProps<Theme> = {
  textAlign: 'center',
  mt: 6,
};

export const featureCardSx: SxProps<Theme> = {
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'transform 0.3s',
  '&:hover': {
    transform: 'translateY(-8px)',
  },
};

export const featureIconContainerSx: SxProps<Theme> = {
  ...mixins.flexCenter,
  pt: 3,
  pb: 1,
};

export const featureActionsSx: SxProps<Theme> = {
  justifyContent: 'center',
  pb: 3,
};

export const ctaSectionSx: SxProps<Theme> = {
  bgcolor: 'secondary.main',
  color: 'secondary.contrastText',
  py: 8,
};

export const ctaButtonContainerSx: SxProps<Theme> = {
  ...mixins.flexCenter,
  mt: 4,
};

export const footerSx: SxProps<Theme> = {
  bgcolor: 'background.paper',
  py: 4,
};

export const footerDividerSx: SxProps<Theme> = {
  mb: 4,
};

export const footerLinksBoxSx: SxProps<Theme> = {
  ...mixins.flexColumn,
  gap: 1,
};

export const footerCopyrightSx: SxProps<Theme> = {
  mt: 4,
  textAlign: 'center',
};

export const dividerSx: SxProps<Theme> = {
  my: 4,
};

export const featuresSubtitleSx: SxProps<Theme> = {
  mb: 8,
  maxWidth: 800,
  mx: 'auto',
};
