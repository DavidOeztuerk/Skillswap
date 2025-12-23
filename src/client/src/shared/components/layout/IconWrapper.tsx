import React, { type ReactElement, Suspense } from 'react';
import type { SvgIconProps } from '@mui/material';

interface IconWrapperProps {
  children: ReactElement<SvgIconProps>;
  size?: 'small' | 'medium' | 'large';
}

const IconWrapper: React.FC<IconWrapperProps> = ({ children, size = 'medium' }) => {
  const iconProps: Partial<SvgIconProps> = {
    fontSize: size === 'small' ? 'small' : 'medium',
  };

  return (
    <Suspense
      fallback={
        <div
          style={{
            width: size === 'small' ? 20 : 24,
            height: size === 'small' ? 20 : 24,
            backgroundColor: 'rgba(0, 0, 0, 0.04)',
            borderRadius: '4px',
          }}
        />
      }
    >
      {React.cloneElement(children, iconProps)}
    </Suspense>
  );
};

export default IconWrapper;
