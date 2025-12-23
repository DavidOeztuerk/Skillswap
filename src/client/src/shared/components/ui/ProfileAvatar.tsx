import React, { useMemo } from 'react';
import { Avatar, type SxProps, type Theme } from '@mui/material';
import { stringToColor } from '../../utils/formatters';

interface ProfileAvatarProps {
  src?: string | null;
  alt: string;
  size?: number;
  showText?: boolean;
  sx?: SxProps<Theme>;
}

const DEFAULT_SX: SxProps<Theme> = {};

/**
 * Avatar component for user profiles with fallback to initials
 * when no image is available
 */
const ProfileAvatar: React.FC<ProfileAvatarProps> = ({
  src,
  alt,
  size = 40,
  showText = true,
  sx = DEFAULT_SX,
}) => {
  // Generate initials from name
  const initials = useMemo(() => {
    const safeAlt = alt;
    if (!safeAlt) return '';

    const nameParts = safeAlt.split(' ').filter((part): part is string => part.length > 0);
    if (nameParts.length === 0) return '';

    const firstPart = nameParts[0] ?? '';
    if (nameParts.length === 1) {
      return firstPart.charAt(0).toUpperCase();
    }

    const lastIndex = nameParts.length - 1;
    const lastPart = nameParts[lastIndex] ?? '';
    const first = firstPart.charAt(0).toUpperCase();
    const last = lastPart.charAt(0).toUpperCase();
    return first + last;
  }, [alt]);

  // Generate background color from name
  const backgroundColor = useMemo(() => {
    if (src || !showText) return;
    return stringToColor(alt);
  }, [src, alt, showText]);

  return (
    <Avatar
      src={src ?? undefined}
      alt={alt}
      sx={[
        {
          width: size,
          height: size,
          fontSize: size * 0.4,
          bgcolor: backgroundColor,
        },
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {!src && showText ? initials : null}
    </Avatar>
  );
};

export default ProfileAvatar;
