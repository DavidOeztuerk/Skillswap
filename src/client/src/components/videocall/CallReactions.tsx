/**
 * CallReactions Component
 *
 * Provides emoji reaction buttons and floating animation overlay for video calls.
 * Features:
 * - Quick emoji reactions (thumbs up, heart, applause, laugh, wow)
 * - Floating animation for sent reactions
 * - Optional sound feedback
 * - Received reactions from other participants
 */
import React, { useState, useCallback, useEffect } from 'react';
import { Box, IconButton, Tooltip, Paper, Fade, keyframes } from '@mui/material';
import {
  ThumbUp as ThumbUpIcon,
  Favorite as HeartIcon,
  EmojiEmotions as LaughIcon,
  Celebration as CelebrationIcon,
  Star as StarIcon,
} from '@mui/icons-material';

// Animation keyframes for floating reactions
const floatUp = keyframes`
  0% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  50% {
    opacity: 0.8;
    transform: translateY(-100px) scale(1.2);
  }
  100% {
    opacity: 0;
    transform: translateY(-200px) scale(0.8);
  }
`;

const pulse = keyframes`
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
`;

export type ReactionType = 'thumbsUp' | 'heart' | 'applause' | 'laugh' | 'wow';

interface Reaction {
  id: string;
  type: ReactionType;
  x: number;
  timestamp: number;
}

interface ReceivedReaction {
  type: ReactionType;
  senderId: string;
  id?: string; // Optional unique ID for tracking
}

interface CallReactionsProps {
  onSendReaction: (reaction: ReactionType) => void;
  receivedReactions?: ReceivedReaction[];
  disabled?: boolean;
  position?: 'bottom-left' | 'bottom-right' | 'top-right';
  compact?: boolean;
}

const reactionConfig: Record<
  ReactionType,
  { icon: React.ReactNode; emoji: string; label: string; color: string }
> = {
  thumbsUp: {
    icon: <ThumbUpIcon />,
    emoji: '👍',
    label: 'Daumen hoch',
    color: '#4caf50',
  },
  heart: {
    icon: <HeartIcon />,
    emoji: '❤️',
    label: 'Herz',
    color: '#e91e63',
  },
  applause: {
    icon: <CelebrationIcon />,
    emoji: '👏',
    label: 'Applaus',
    color: '#ff9800',
  },
  laugh: {
    icon: <LaughIcon />,
    emoji: '😄',
    label: 'Lachen',
    color: '#ffeb3b',
  },
  wow: {
    icon: <StarIcon />,
    emoji: '🌟',
    label: 'Wow',
    color: '#9c27b0',
  },
};

const CallReactions: React.FC<CallReactionsProps> = ({
  onSendReaction,
  receivedReactions = [],
  disabled = false,
  position = 'bottom-left',
  compact = false,
}) => {
  const [floatingReactions, setFloatingReactions] = useState<Reaction[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [processedReactionIds] = useState(() => new Set<string>());

  // Add floating reaction callback
  const addFloatingReaction = useCallback((type: ReactionType) => {
    const now = Date.now();
    const newReaction: Reaction = {
      id: `local-${String(now)}-${String(Math.random())}`,
      type,
      x: 20 + Math.random() * 60,
      timestamp: now,
    };
    setFloatingReactions((prev) => [...prev, newReaction]);
  }, []);

  // Handle new received reactions - use lazy state initialization to avoid calling during render
  useEffect(() => {
    receivedReactions.forEach((reaction) => {
      const reactionId = reaction.id ?? `${reaction.senderId}-${reaction.type}`;

      // Only process reactions we haven't seen before
      if (!processedReactionIds.has(reactionId)) {
        processedReactionIds.add(reactionId);

        const now = Date.now();
        const newReaction: Reaction = {
          id: reactionId,
          type: reaction.type,
          x: 20 + Math.random() * 60,
          timestamp: now,
        };

        setFloatingReactions((prev) => [...prev, newReaction]);
      }
    });
  }, [receivedReactions, processedReactionIds]);

  // Clean up old reactions
  useEffect(() => {
    const cleanup = setInterval(() => {
      const now = Date.now();
      setFloatingReactions((prev) => prev.filter((r) => now - r.timestamp < 2000));
    }, 500);

    return () => {
      clearInterval(cleanup);
    };
  }, []);

  const handleReactionClick = useCallback(
    (type: ReactionType) => {
      if (disabled) return;

      addFloatingReaction(type);
      onSendReaction(type);
    },
    [disabled, onSendReaction, addFloatingReaction]
  );

  const getPositionStyles = (): {
    bottom?: number;
    left?: number;
    right?: number;
    top?: number;
  } => {
    switch (position) {
      case 'bottom-left':
        return { bottom: 100, left: 16 };
      case 'bottom-right':
        return { bottom: 100, right: 16 };
      case 'top-right':
        return { top: 16, right: 16 };
      default:
        return { bottom: 100, left: 16 };
    }
  };

  return (
    <>
      {/* Floating Reactions Overlay */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '100%',
          pointerEvents: 'none',
          overflow: 'hidden',
          zIndex: 1100,
        }}
      >
        {floatingReactions.map((reaction) => (
          <Box
            key={reaction.id}
            sx={{
              position: 'absolute',
              bottom: 100,
              left: `${String(reaction.x)}%`,
              fontSize: '3rem',
              animation: `${floatUp} 2s ease-out forwards`,
              zIndex: 1100,
            }}
          >
            {reactionConfig[reaction.type].emoji}
          </Box>
        ))}
      </Box>

      {/* Reaction Buttons */}
      <Paper
        elevation={4}
        onMouseEnter={() => {
          setIsExpanded(true);
        }}
        onMouseLeave={() => {
          setIsExpanded(false);
        }}
        sx={{
          position: 'absolute',
          ...getPositionStyles(),
          display: 'flex',
          flexDirection: compact ? 'row' : 'column',
          gap: 0.5,
          p: 1,
          borderRadius: 3,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(10px)',
          zIndex: 1000,
          transition: 'all 0.3s ease',
          overflow: 'hidden',
          maxHeight: isExpanded || !compact ? 300 : 56,
        }}
      >
        {Object.entries(reactionConfig).map(([type, config]) => (
          <Fade in={isExpanded || !compact} key={type} timeout={200}>
            <Box>
              <Tooltip title={config.label} placement="right" arrow>
                <span>
                  <IconButton
                    onClick={() => {
                      handleReactionClick(type as ReactionType);
                    }}
                    disabled={disabled}
                    size={compact ? 'small' : 'medium'}
                    sx={{
                      color: 'white',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        backgroundColor: `${config.color}40`,
                        transform: 'scale(1.1)',
                      },
                      '&:active': {
                        animation: `${pulse} 0.3s ease`,
                      },
                      '&.Mui-disabled': {
                        color: 'rgba(255, 255, 255, 0.3)',
                      },
                    }}
                  >
                    <Box sx={{ fontSize: compact ? '1.2rem' : '1.5rem' }}>{config.emoji}</Box>
                  </IconButton>
                </span>
              </Tooltip>
            </Box>
          </Fade>
        ))}
      </Paper>
    </>
  );
};

export default CallReactions;
