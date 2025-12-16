import React, { useEffect, useRef, useCallback, type JSX } from 'react';
import { Box, Typography, Button, CircularProgress, type SxProps, type Theme } from '@mui/material';
import SkeletonLoader from './SkeletonLoader';
import useProgressiveLoading from '../../hooks/useProgressiveLoading';

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
}

function InfiniteScrollList<T>({
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
  deps = [],
  containerSx = {},
}: InfiniteScrollListProps<T>): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const { items, isLoading, isLoadingMore, hasMore, error, totalCount, loadMore, refresh } =
    useProgressiveLoading({
      loadFn,
      pageSize,
      deps,
    });

  const handleScroll = useCallback(() => {
    if (!containerRef.current || isLoadingMore || !hasMore) return;

    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const remainingHeight = scrollHeight - scrollTop - clientHeight;

    if (remainingHeight <= threshold) {
      void loadMore();
    }
  }, [isLoadingMore, hasMore, threshold, loadMore]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || showLoadMoreButton) return;

    container.addEventListener('scroll', handleScroll);
    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll, showLoadMoreButton]);

  // Intersection Observer for automatic loading
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
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, isLoadingMore, loadMore, showLoadMoreButton]);

  const defaultRenderEmpty = (): JSX.Element => (
    <Box sx={{ textAlign: 'center', py: 4 }}>
      <Typography variant="body1" color="text.secondary">
        {emptyMessage}
      </Typography>
    </Box>
  );

  const defaultRenderError = (errorMsg: string, retry: () => void): JSX.Element => (
    <Box sx={{ textAlign: 'center', py: 4 }}>
      <Typography variant="body1" color="error" sx={{ mb: 2 }}>
        {errorMsg}
      </Typography>
      <Button variant="outlined" onClick={retry}>
        Erneut versuchen
      </Button>
    </Box>
  );

  // Initial loading
  if (isLoading && items.length === 0) {
    return (
      <Box sx={containerSx}>
        <SkeletonLoader variant={skeletonVariant} count={skeletonCount} />
      </Box>
    );
  }

  // Error state
  if (error !== null && error !== '' && items.length === 0) {
    return (
      <Box sx={containerSx}>
        {renderError !== undefined
          ? renderError(error, () => {
              void refresh();
            })
          : defaultRenderError(error, () => {
              void refresh();
            })}
      </Box>
    );
  }

  // Empty state
  if (!isLoading && items.length === 0) {
    return (
      <Box sx={containerSx}>{renderEmpty !== undefined ? renderEmpty() : defaultRenderEmpty()}</Box>
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
        <Box key={index}>{renderItem(item, index)}</Box>
      ))}

      {/* Load more content */}
      {hasMore && (
        <Box sx={{ textAlign: 'center', py: 2 }}>
          {showLoadMoreButton ? (
            <Button
              variant="outlined"
              onClick={loadMore}
              disabled={isLoadingMore}
              startIcon={isLoadingMore && <CircularProgress size={16} />}
            >
              {isLoadingMore ? loadingMessage : 'Mehr laden'}
            </Button>
          ) : (
            isLoadingMore && (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                <CircularProgress size={20} />
                <Typography variant="body2" color="text.secondary">
                  {loadingMessage}
                </Typography>
              </Box>
            )
          )}
        </Box>
      )}

      {/* Intersection observer target */}
      {!showLoadMoreButton && hasMore && (
        <div
          ref={(el) => {
            if (el && observerRef.current) {
              observerRef.current.observe(el);
            }
          }}
          style={{ height: '1px' }}
        />
      )}

      {/* Total count info */}
      {totalCount > 0 && (
        <Box sx={{ textAlign: 'center', py: 1 }}>
          <Typography variant="caption" color="text.secondary">
            {items.length} von {totalCount} Elementen
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default InfiniteScrollList;
