import React, { useMemo } from 'react';
import { Avatar, SxProps, Theme } from '@mui/material';
import { stringToColor } from '../../utils/formatters';
import { withDefault } from '../../utils/safeAccess';

interface ProfileAvatarProps {
  src?: string | null;
  alt: string;
  size?: number;
  showText?: boolean;
  sx?: SxProps<Theme>;
}

/**
 * Avatar component for user profiles with fallback to initials
 * when no image is available
 */
const ProfileAvatar: React.FC<ProfileAvatarProps> = ({
  src,
  alt,
  size = 40,
  showText = true,
  sx = {},
}) => {
  // Generate initials from name
  const initials = useMemo(() => {
    const safeAlt = alt;
    if (!safeAlt) return '';

    const nameParts = safeAlt?.split(' ')?.filter((part) => part && part.length > 0);
    if (nameParts.length === 0) return '';

    if (nameParts.length === 1) {
      return withDefault(nameParts[0], '').charAt(0).toUpperCase();
    }

    const first = withDefault(nameParts[0], '').charAt(0).toUpperCase();
    const last = withDefault(nameParts[nameParts.length - 1], '').charAt(0).toUpperCase();
    return first + last;
  }, [alt]);

  // Generate background color from name
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