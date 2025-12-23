import React, { useContext } from 'react';
import StreamContext from './StreamContext';
import type { StreamContextValue } from './streamContextTypes';

// ============================================================================
// Hook
// ============================================================================

export const useStreams = (): StreamContextValue => {
  const context = useContext(StreamContext);

  if (!context) {
    throw new Error('useStreams must be used within a StreamProvider');
  }

  return context;
};

// ============================================================================
// HOC for Legacy Components
// ============================================================================

export interface WithStreamsProps {
  streams: StreamContextValue;
}

export function withStreams<P extends WithStreamsProps>(
  WrappedComponent: React.ComponentType<P>
): React.FC<Omit<P, 'streams'>> {
  const WithStreamsComponent: React.FC<Omit<P, 'streams'>> = (props) => {
    const streams = useStreams();
    return <WrappedComponent {...(props as P)} streams={streams} />;
  };

  // React components always have a name property, but displayName is optional
  const baseName = WrappedComponent.displayName ?? (WrappedComponent.name || 'Component');
  WithStreamsComponent.displayName = `withStreams(${baseName})`;

  return WithStreamsComponent;
}
