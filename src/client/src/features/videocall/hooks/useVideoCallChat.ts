/**
 * useVideoCallChat Hook
 *
 * Manages in-call chat functionality with E2EE support.
 * Handles sending/receiving messages and encryption.
 */

import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../../core/store/store.hooks';
import { withDefault } from '../../../shared/utils/safeAccess';
import {
  selectIsChatOpen,
  selectChatMessages,
  selectChatE2EEStatus,
  selectIsChatE2EEActive,
  selectChatE2EEStats,
  selectRoomId,
} from '../store/videoCallSelectors';
import { toggleChat, incrementChatMessagesEncrypted, addMessage } from '../store/videoCallSlice';
import type { ChatE2EEState } from './types';
import type { VideoCallSharedRefs } from './VideoCallContext';
import type { EncryptedMessage } from '../../../shared/utils/crypto/e2eeChatEncryption';
import type { ChatMessage } from '../../chat/types/ChatMessage';

// ============================================================================
// Types
// ============================================================================

export interface UseVideoCallChatReturn {
  messages: ChatMessage[];
  isChatOpen: boolean;
  chatE2EE: ChatE2EEState;
  toggleChatPanel: () => void;
  sendMessage: (content: string) => Promise<void>;
}

// ============================================================================
// Hook
// ============================================================================

export const useVideoCallChat = (refs: VideoCallSharedRefs): UseVideoCallChatReturn => {
  const dispatch = useAppDispatch();

  // Selectors
  const isChatOpen = useAppSelector(selectIsChatOpen);
  const messages = useAppSelector(selectChatMessages);
  const chatE2EEStatus = useAppSelector(selectChatE2EEStatus);
  const isChatE2EEActive = useAppSelector(selectIsChatE2EEActive);
  const chatStats = useAppSelector(selectChatE2EEStats);
  const roomId = useAppSelector(selectRoomId);

  /**
   * Get fingerprints from chat manager
   * Note: Computed inline since refs are stable and this is a cheap operation
   */
  const getChatFingerprints = useCallback((): {
    localFingerprint: string | null;
    peerFingerprint: string | null;
  } => {
    if (!roomId || chatE2EEStatus !== 'active') {
      return { localFingerprint: null, peerFingerprint: null };
    }

    const keyMaterial = refs.chatManagerRef.current.getConversationKeyMaterial(roomId);
    if (!keyMaterial) {
      return { localFingerprint: null, peerFingerprint: null };
    }

    return {
      localFingerprint: keyMaterial.localFingerprint,
      peerFingerprint: keyMaterial.peerFingerprint,
    };
  }, [roomId, chatE2EEStatus, refs]);

  /**
   * Toggle chat panel visibility
   */
  const toggleChatPanel = useCallback(() => {
    dispatch(toggleChat());
  }, [dispatch]);

  /**
   * Send a chat message (with E2EE if active)
   */
  const sendMessage = useCallback(
    async (content: string) => {
      const connection = refs.signalRConnectionRef.current;
      const sessionId = refs.sessionIdRef.current;
      const currentRoomId = refs.roomIdRef.current;
      const user = refs.userRef.current;
      const currentChatE2EEStatus = refs.chatE2EEStatusRef.current;

      if (!connection || !sessionId || !currentRoomId || !user) return;

      const senderName = withDefault(user.firstName, 'Ich');
      let messageContent = content;
      let encryptedData: EncryptedMessage | null = null;

      // Encrypt message if E2EE is active
      if (currentChatE2EEStatus === 'active') {
        try {
          encryptedData = await refs.chatManagerRef.current.encryptMessage(currentRoomId, content);
          messageContent = JSON.stringify(encryptedData);
          dispatch(incrementChatMessagesEncrypted());
        } catch {
          // Fall back to unencrypted if encryption fails
        }
      }

      // Add message to local state (show original content to sender)
      const msg: ChatMessage = {
        id: Date.now().toString(),
        sessionId,
        senderId: user.id,
        senderName,
        message: content,
        sentAt: new Date().toISOString(),
        messageType: encryptedData ? 'Encrypted' : 'Text',
        isEncrypted: !!encryptedData,
        isVerified: true,
      };

      dispatch(addMessage(msg));

      // Send via SignalR
      try {
        await connection.invoke('SendChatMessage', currentRoomId, messageContent);
      } catch (e) {
        console.error('Error sending chat message:', e);
      }
    },
    [dispatch, refs]
  );

  const fingerprints = getChatFingerprints();

  return {
    messages,
    isChatOpen,
    chatE2EE: {
      status: chatE2EEStatus,
      isActive: isChatE2EEActive,
      localFingerprint: fingerprints.localFingerprint,
      peerFingerprint: fingerprints.peerFingerprint,
      stats: chatStats,
    },
    toggleChatPanel,
    sendMessage,
  };
};

export default useVideoCallChat;
