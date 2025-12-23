/**
 * useVideoCallParticipants Hook
 *
 * Manages the list of participants in a video call.
 * Handles join/leave events and media state updates.
 */

import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../../core/store/store.hooks';
import { selectParticipants } from '../store/videoCallSelectors';
import {
  addParticipant as addParticipantAction,
  removeParticipant as removeParticipantAction,
  updateParticipant as updateParticipantAction,
} from '../store/videoCallSlice';
import type { CallParticipant } from '../store/videoCallAdapter+State';

// ============================================================================
// Types - Exported for external use
// ============================================================================

export interface UseVideoCallParticipantsReturn {
  participants: CallParticipant[];
  addParticipant: (participant: CallParticipant) => void;
  removeParticipant: (id: string) => void;
  updateParticipant: (id: string, updates: Partial<CallParticipant>) => void;
}

// ============================================================================
// Hook
// ============================================================================

export const useVideoCallParticipants = (): UseVideoCallParticipantsReturn => {
  const dispatch = useAppDispatch();
  const participants = useAppSelector(selectParticipants);

  /**
   * Add a new participant to the call
   */
  const addParticipant = useCallback(
    (participant: CallParticipant) => {
      dispatch(addParticipantAction(participant));
    },
    [dispatch]
  );

  /**
   * Remove a participant from the call
   */
  const removeParticipant = useCallback(
    (id: string) => {
      dispatch(removeParticipantAction(id));
    },
    [dispatch]
  );

  /**
   * Update a participant's state (muted, video, etc.)
   */
  const updateParticipant = useCallback(
    (id: string, updates: Partial<CallParticipant>) => {
      dispatch(updateParticipantAction({ id, ...updates }));
    },
    [dispatch]
  );

  return {
    participants,
    addParticipant,
    removeParticipant,
    updateParticipant,
  };
};

export default useVideoCallParticipants;
