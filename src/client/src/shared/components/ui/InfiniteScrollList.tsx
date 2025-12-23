import React, { useEffect, useRef, useCallback, type JSX } from 'react';
import { Box, Typography, Button, CircularProgress, type SxProps, type Theme } from '@mui/material';
import useProgressiveLoading from '../../hooks/useProgressiveLoading';
import SkeletonLoader from './SkeletonLoader';

// Default values outside component to prevent re-renders
const DEFAULT_DEPS: React.DependencyList = [];
const DEFAULT_CONTAINER_SX: SxProps<Theme> = {};

interface InfiniteScrollListProps<T> {
  loadFn: (
    page: number,
    pageSize: number,
    ...args: unknown[]
  ) => Promise<{
    data: T[];
    totalCount: number;
    hasMore: boolean;
  }>;
  renderItem: (item: T, index: number) => React.ReactNode;
  renderEmpty?: () => React.ReactNode;
  renderError?: (error: string, retry: () => void) => React.ReactNode;
  pageSize?: number;
  threshold?: number;
  skeletonVariant?: 'card' | 'list' | 'text';
  skeletonCount?: number;
  showLoadMoreButton?: boolean;
  emptyMessage?: string;
  loadingMessage?: string;
  deps?: React.DependencyList;
  containerSx?: SxProps<Theme>;
  getItemKey?: (item: T, index: number) => string;
}

// Helper components to reduce cognitive complexity
interface EmptyStateProps {
  message: string;
}

const DefaultEmptyState: React.FC<EmptyStateProps> = ({ message }) => (
  <Box sx={{ textAlign: 'center', py: 4 }}>
    <Typography variant="body1" color="text.secondary">
      {message}
    </Typography>
  </Box>
);

interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

const DefaultErrorState: React.FC<ErrorStateProps> = ({ message, onRetry }) => (
  <Box sx={{ textAlign: 'center', py: 4 }}>
    <Typography variant="body1" color="error" sx={{ mb: 2 }}>
      {message}
    </Typography>
    <Button variant="outlined" onClick={onRetry}>
      Erneut versuchen
    </Button>
  </Box>
);

interface LoadMoreButtonProps {
  onClick: () => void;
  isLoading: boolean;
  loadingMessage: string;
}

const LoadMoreButton: React.FC<LoadMoreButtonProps> = ({ onClick, isLoading, loadingMessage }) => (
  <Button
    variant="outlined"
    onClick={onClick}
    disabled={isLoading}
    startIcon={isLoading ? <CircularProgress size={16} /> : null}
  >
    {isLoading ? loadingMessage : 'Mehr laden'}
  </Button>
);

interface LoadingIndicatorProps {
  message: string;
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ message }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
    <CircularProgress size={20} />
    <Typography variant="body2" color="text.secondary">
      {message}
    </Typography>
  </Box>
);

// Custom hook for scroll handling
const useScrollHandler = (
  containerRef: React.RefObject<HTMLDivElement | null>,
  isLoadingMore: boolean,
  hasMore: boolean,
  threshold: number,
  loadMore: () => Promise<void>,
  showLoadMoreButton: boolean
): void => {
  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (container === null || isLoadingMore || !hasMore) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const remainingHeight = scrollHeight - scrollTop - clientHeight;

    if (remainingHeight <= threshold) {
      void loadMore();
    }
  }, [containerRef, isLoadingMore, hasMore, threshold, loadMore]);

  useEffect(() => {
    const container = containerRef.current;
    if (container === null || showLoadMoreButton) return;

    container.addEventListener('scroll', handleScroll);
    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [containerRef, handleScroll, showLoadMoreButton]);
};

// Custom hook for intersection observer
const useIntersectionObserver = (
  hasMore: boolean,
  isLoadingMore: boolean,
  loadMore: () => Promise<void>,
  showLoadMoreButton: boolean
): React.RefObject<IntersectionObserver | null> => {
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (showLoadMoreButton) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && hasMore && !isLoadingMore) {
          void loadMore();
        }
      },
      { threshold: 0.1 }
    );

    observerRef.current = observer;

    return () => {
      if (observerRef.current !== null) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, isLoadingMore, loadMore, showLoadMoreButton]);

  return observerRef;
};

// Loading state component
interface LoadingStateProps {
  containerSx: SxProps<Theme>;
  skeletonVariant: 'card' | 'list' | 'text';
  skeletonCount: number;
}

const LoadingState: React.FC<LoadingStateProps> = ({
  containerSx,
  skeletonVariant,
  skeletonCount,
}) => (
  <Box sx={containerSx}>
    <SkeletonLoader variant={skeletonVariant} count={skeletonCount} />
  </Box>
);

// Error state wrapper component
interface ErrorStateWrapperProps {
  containerSx: SxProps<Theme>;
  error: string;
  onRetry: () => void;
  renderError?: (error: string, retry: () => void) => React.ReactNode;
}

const ErrorStateWrapper: React.FC<ErrorStateWrapperProps> = ({
  containerSx,
  error,
  onRetry,
  renderError,
}) => (
  <Box sx={containerSx}>
    {renderError === undefined ? (
      <DefaultErrorState message={error} onRetry={onRetry} />
    ) : (
      renderError(error, onRetry)
    )}
  </Box>
);

// Empty state wrapper component
interface EmptyStateWrapperProps {
  containerSx: SxProps<Theme>;
  emptyMessage: string;
  renderEmpty?: () => React.ReactNode;
}

const EmptyStateWrapper: React.FC<EmptyStateWrapperProps> = ({
  containerSx,
  emptyMessage,
  renderEmpty,
}) => (
  <Box sx={containerSx}>
    {renderEmpty === undefined ? <DefaultEmptyState message={emptyMessage} /> : renderEmpty()}
  </Box>
);

// Load more section component
interface LoadMoreSectionProps {
  hasMore: boolean;
  showLoadMoreButton: boolean;
  isLoadingMore: boolean;
  loadMore: () => void;
  loadingMessage: string;
}

const LoadMoreSection: React.FC<LoadMoreSectionProps> = ({
  hasMore,
  showLoadMoreButton,
  isLoadingMore,
  loadMore,
  loadingMessage,
}) => {
  if (!hasMore) return null;

  return (
    <Box sx={{ textAlign: 'center', py: 2 }}>
      {showLoadMoreButton ? (
        <LoadMoreButton
          onClick={loadMore}
          isLoading={isLoadingMore}
          loadingMessage={loadingMessage}
        />
      ) : null}
      {!showLoadMoreButton && isLoadingMore ? <LoadingIndicator message={loadingMessage} /> : null}
    </Box>
  );
};

// Total count component
interface TotalCountInfoProps {
  itemsCount: number;
  totalCount: number;
}

const TotalCountInfo: React.FC<TotalCountInfoProps> = ({ itemsCount, totalCount }) => {
  if (totalCount <= 0) return null;

  return (
    <Box sx={{ textAlign: 'center', py: 1 }}>
      <Typography variant="caption" color="text.secondary">
        {itemsCount} von {totalCount} Elementen
      </Typography>
    </Box>
  );
};

const InfiniteScrollList = <T,>({
  loadFn,
  renderItem,
  renderEmpty,
  renderError,
  pageSize = 10,
  threshold = 200,
  skeletonVariant = 'card',
  skeletonCount = 3,
  showLoadMoreButton = false,
  emptyMessage = 'Keine Elemente gefunden',
  loadingMessage = 'Lade weitere Elemente...',
  deps = DEFAULT_DEPS,
  containerSx = DEFAULT_CONTAINER_SX,
  getItemKey,
}: InfiniteScrollListProps<T>): JSX.Element => {
  const containerRef = useRef<HTMLDivElement>(null);

  const { items, isLoading, isLoadingMore, hasMore, error, totalCount, loadMore, refresh } =
    useProgressiveLoading({
      loadFn,
      pageSize,
      deps,
    });

  // Use extracted hooks for scroll and intersection observer
  useScrollHandler(containerRef, isLoadingMore, hasMore, threshold, loadMore, showLoadMoreButton);
  const observerRef = useIntersectionObserver(hasMore, isLoadingMore, loadMore, showLoadMoreButton);

  const handleRetry = useCallback(() => {
    void refresh();
  }, [refresh]);

  // Initial loading
  if (isLoading && items.length === 0) {
    return (
      <LoadingState
        containerSx={containerSx}
        skeletonVariant={skeletonVariant}
        skeletonCount={skeletonCount}
      />
    );
  }

  // Error state
  if (error !== null && error !== '' && items.length === 0) {
    return (
      <ErrorStateWrapper
        containerSx={containerSx}
        error={error}
        onRetry={handleRetry}
        renderError={renderError}
      />
    );
  }

  // Empty state
  if (!isLoading && items.length === 0) {
    return (
      <EmptyStateWrapper
        containerSx={containerSx}
        emptyMessage={emptyMessage}
        renderEmpty={renderEmpty}
      />
    );
  }

  return (
    <Box
      ref={containerRef}
      sx={[
        {
          height: '100%',
          overflow: 'auto',
        },
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        ...(Array.isArray(containerSx) ? containerSx : [containerSx]),
      ]}
    >
      {/* Render items */}
      {items.map((item, index) => (
        <Box key={getItemKey === undefined ? `list-item-${index}` : getItemKey(item, index)}>
          {renderItem(item, index)}
        </Box>
      ))}

      {/* Load more content */}
      <LoadMoreSection
        hasMore={hasMore}
        showLoadMoreButton={showLoadMoreButton}
        isLoadingMore={isLoadingMore}
        loadMore={loadMore}
        loadingMessage={loadingMessage}
      />

      {/* Intersection observer target */}
      {!showLoadMoreButton && hasMore ? (
        <div
          ref={(el) => {
            if (el !== null && observerRef.current !== null) {
              observerRef.current.observe(el);
            }
          }}
          style={{ height: '1px' }}
        />
      ) : null}

      {/* Total count info */}
      <TotalCountInfo itemsCount={items.length} totalCount={totalCount} />
    </Box>
  );
};

export default InfiniteScrollList;
