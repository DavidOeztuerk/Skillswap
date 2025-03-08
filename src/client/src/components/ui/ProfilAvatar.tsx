// src/components/ui/ProfileAvatar.tsx
import React, { useMemo } from 'react';
import { Avatar, SxProps, Theme } from '@mui/material';
import { stringToColor } from '../../utils/formatters';

interface ProfileAvatarProps {
  src?: string | null;
  alt: string;
  size?: number;
  showText?: boolean;
  sx?: SxProps<Theme>;
}

/**
 * Avatar-Komponente für Benutzerprofile mit Fallback zu Initialen
 * wenn kein Bild vorhanden ist
 */
const ProfileAvatar: React.FC<ProfileAvatarProps> = ({
  src,
  alt,
  size = 40,
  showText = true,
  sx = {},
}) => {
  // Initialen aus dem Namen generieren
  const initials = useMemo(() => {
    if (!alt) return '';

    const nameParts = alt.split(' ').filter((part) => part.length > 0);
    if (nameParts.length === 0) return '';

    if (nameParts.length === 1) {
      return nameParts[0].charAt(0).toUpperCase();
    }

    return (
      nameParts[0].charAt(0).toUpperCase() +
      nameParts[nameParts.length - 1].charAt(0).toUpperCase()
    );
  }, [alt]);

  // Hintergrundfarbe aus dem Namen generieren
  const backgroundColor = useMemo(() => {
    if (src || !showText) return undefined;
    return stringToColor(alt);
  }, [src, alt, showText]);

  return (
    <Avatar
      src={src || undefined}
      alt={alt}
      sx={{
        width: size,
        height: size,
        fontSize: size * 0.4,
        bgcolor: backgroundColor,
        ...sx,
      }}
    >
      {!src && showText ? initials : null}
    </Avatar>
  );
};

export default ProfileAvatar;
