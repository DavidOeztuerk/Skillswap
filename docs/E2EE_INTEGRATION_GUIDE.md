# E2EE Integration Guide

## 📚 Overview

This guide explains how to integrate End-to-End Encryption (E2EE) into the Skillswap video call and chat features.

---

## 🎥 Video Call E2EE Integration

### 1. Import Required Modules

```typescript
import { useE2EEVideoCall } from '../hooks/useE2EEVideoCall';
import { E2EEStatusComponent } from '../components/videocall/E2EEStatus';
```

### 2. Add E2EE Hook to VideoCallPage

```typescript
// In VideoCallPage.tsx or EnhancedVideoCallPage.tsx

const VideoCallPage: React.FC = () => {
  // Existing video call hook
  const {
    peerConnection,
    signalRConnection,
    roomId,
    peerId,
    isInitiator,
    // ... other properties
  } = useVideoCall();

  // NEW: Add E2EE hook
  const e2ee = useE2EEVideoCall({
    peerConnection,
    signalRConnection,
    roomId,
    peerId,
    isInitiator,
    autoEnable: true,        // Automatically enable E2EE when call starts
    enableKeyRotation: true, // Rotate keys every 60 seconds
  });

  return (
    <Box>
      {/* Video UI */}
      <RemoteVideo stream={remoteStream} />
      <LocalVideo stream={localStream} />

      {/* NEW: E2EE Status Indicator */}
      <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
        <E2EEStatusComponent
          status={e2ee.e2eeStatus}
          isActive={e2ee.isE2EEActive}
          localFingerprint={e2ee.formattedLocalFingerprint}
          remoteFingerprint={e2ee.formattedRemoteFingerprint}
          keyGeneration={e2ee.keyGeneration}
          encryptionStats={e2ee.encryptionStats}
          errorMessage={e2ee.errorMessage}
          onRotateKeys={e2ee.rotateKeys}
        />
      </Box>

      {/* Rest of UI */}
    </Box>
  );
};
```

### 3. Handle E2EE Errors

```typescript
// Display error if browser doesn't support E2EE
if (!e2ee.compatibility.supported) {
  return (
    <Alert severity="warning">
      {e2ee.compatibility.message}
      <Typography variant="caption" display="block">
        Please use Chrome 86+, Edge 86+, or Firefox 117+ for encrypted calls.
      </Typography>
    </Alert>
  );
}
```

---

## 💬 Chat E2EE Integration

### 1. Import Required Modules

```typescript
import { useE2EEChat } from '../hooks/useE2EEChat';
import {
  MessageE2EEIndicator,
  ChatE2EEStatusHeader,
  VerificationBadge,
} from '../components/videocall/ChatE2EEIndicator';
import { EncryptedMessage } from '../utils/crypto/e2eeChatEncryption';
```

### 2. Add Chat E2EE Hook

```typescript
// In ChatPanel.tsx or VideoCallPage.tsx

const ChatPanel: React.FC = () => {
  const { roomId, sendChatMessage, messages } = useVideoCall();

  // Get encryption key from video E2EE
  const videoE2EE = useE2EEVideoCall({ /* ... */ });
  const currentKeyMaterial = videoE2EE.encryptionKey; // From E2EEManager

  // NEW: Add chat E2EE hook
  const chatE2EE = useE2EEChat({
    conversationId: roomId,
    sharedEncryptionKey: currentKeyMaterial?.encryptionKey || null,
    enabled: true,
    autoInitialize: true,
  });

  // ... rest of component
};
```

### 3. Encrypt Outgoing Messages

```typescript
const handleSendMessage = async (content: string) => {
  if (!chatE2EE.isActive) {
    // Fallback: Send unencrypted if E2EE not active
    await sendChatMessage({ content, isEncrypted: false });
    return;
  }

  try {
    // Encrypt message
    const encrypted = await chatE2EE.encryptMessage(content);

    // Send encrypted message via SignalR
    await sendChatMessage({
      content: JSON.stringify(encrypted), // Serialize EncryptedMessage
      isEncrypted: true,
    });
  } catch (error) {
    console.error('Failed to encrypt message:', error);
    // Show error to user or fallback to unencrypted
  }
};
```

### 4. Decrypt Incoming Messages

```typescript
const handleReceiveMessage = async (message: ChatMessage) => {
  if (!message.isEncrypted) {
    // Unencrypted message - display directly
    addMessage(message);
    return;
  }

  try {
    // Parse encrypted message
    const encrypted: EncryptedMessage = JSON.parse(message.content);

    // Decrypt message
    const decrypted = await chatE2EE.decryptMessage(encrypted);

    // Add decrypted message to chat
    addMessage({
      ...message,
      content: decrypted.content,
      isVerified: decrypted.isVerified,
      senderFingerprint: decrypted.senderFingerprint,
    });
  } catch (error) {
    console.error('Failed to decrypt message:', error);
    // Show error indicator in chat
    addMessage({
      ...message,
      content: '[Decryption failed]',
      isVerified: false,
    });
  }
};
```

### 5. Display Encryption Indicators

```typescript
// In message list rendering

<Box>
  {/* Chat E2EE Status Header */}
  <ChatE2EEStatusHeader
    status={chatE2EE.status}
    isActive={chatE2EE.isActive}
    messagesEncrypted={chatE2EE.stats.messagesEncrypted}
    messagesDecrypted={chatE2EE.stats.messagesDecrypted}
    verificationFailures={chatE2EE.stats.verificationFailures}
  />

  {/* Message list */}
  {messages.map((msg) => (
    <Box key={msg.id} sx={{ display: 'flex', alignItems: 'center' }}>
      <Typography>{msg.content}</Typography>

      {/* NEW: Encryption indicator */}
      <MessageE2EEIndicator
        isEncrypted={msg.isEncrypted}
        isVerified={msg.isVerified}
        variant="icon"
      />

      {/* NEW: Verification badge */}
      {msg.isEncrypted && (
        <VerificationBadge
          isVerified={msg.isVerified}
          senderFingerprint={msg.senderFingerprint}
        />
      )}
    </Box>
  ))}
</Box>
```

---

## 🔑 Key Exchange Integration (SignalR)

### Backend: Extend SignalR Hub

**Note**: Currently, VideocallService has been deleted. You need to either:
1. Add a new SignalR Hub for E2EE events
2. Extend an existing hub (e.g., NotificationHub)
3. Use WebRTC Data Channels for key exchange (peer-to-peer)

#### Option 1: Create E2EEHub.cs (Gateway or separate service)

```csharp
using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Authorization;

[Authorize]
public class E2EEHub : Hub
{
    // Key offer (initiator → participant)
    public async Task SendKeyOffer(string roomId, string targetUserId, object keyExchangeMessage)
    {
        var fromUserId = Context.User?.FindFirst("user_id")?.Value
            ?? Context.User?.FindFirst("sub")?.Value;

        await Clients.User(targetUserId).SendAsync("ReceiveKeyOffer", fromUserId, keyExchangeMessage);
    }

    // Key answer (participant → initiator)
    public async Task SendKeyAnswer(string roomId, string targetUserId, object keyExchangeMessage)
    {
        var fromUserId = Context.User?.FindFirst("user_id")?.Value
            ?? Context.User?.FindFirst("sub")?.Value;

        await Clients.User(targetUserId).SendAsync("ReceiveKeyAnswer", fromUserId, keyExchangeMessage);
    }

    // Key rotation (both directions)
    public async Task SendKeyRotation(string roomId, string targetUserId, object keyExchangeMessage)
    {
        var fromUserId = Context.User?.FindFirst("user_id")?.Value
            ?? Context.User?.FindFirst("sub")?.Value;

        await Clients.User(targetUserId).SendAsync("ReceiveKeyRotation", fromUserId, keyExchangeMessage);
    }
}
```

#### Option 2: Use WebRTC Data Channels (No Backend Changes)

```typescript
// In useE2EEVideoCall.ts or useVideoCall.ts

// Create data channel for key exchange
const keyExchangeChannel = peerConnection.createDataChannel('e2ee-key-exchange');

keyExchangeChannel.onmessage = (event) => {
  const message = JSON.parse(event.data);

  switch (message.type) {
    case 'keyOffer':
      handleKeyOffer(message);
      break;
    case 'keyAnswer':
      handleKeyAnswer(message);
      break;
    case 'keyRotation':
      handleKeyRotation(message);
      break;
  }
};

// Send key offer
const sendKeyOffer = (keyExchangeMessage) => {
  keyExchangeChannel.send(JSON.stringify({
    type: 'keyOffer',
    ...keyExchangeMessage,
  }));
};
```

---

## 🔧 Configuration

### Enable/Disable E2EE

```typescript
// Disable E2EE for specific users or scenarios
const e2ee = useE2EEVideoCall({
  peerConnection,
  signalRConnection,
  roomId,
  peerId,
  isInitiator,
  autoEnable: false, // Don't auto-enable
  enableKeyRotation: false, // Disable key rotation
});

// Manually enable later
await e2ee.enableE2EE();
```

### Adjust Key Rotation Interval

```typescript
// In e2eeVideoEncryption.ts
const KEY_ROTATION_INTERVAL = 120 * 1000; // 2 minutes instead of 60 seconds
```

---

## 🧪 Testing E2EE

### 1. Browser Compatibility Test

```typescript
import { getE2EECompatibility } from './utils/crypto/e2eeVideoEncryption';

const compatibility = getE2EECompatibility();
console.log(compatibility);
// { supported: true, browser: 'Chrome', message: '✅ E2EE supported on Chrome' }
```

### 2. Encryption Performance Test

```typescript
// Monitor encryption statistics
useEffect(() => {
  if (e2ee.encryptionStats) {
    console.log('Encryption Stats:', {
      avgEncryptionTime: e2ee.encryptionStats.averageEncryptionTime,
      avgDecryptionTime: e2ee.encryptionStats.averageDecryptionTime,
      successRate: (e2ee.encryptionStats.encryptedFrames / e2ee.encryptionStats.totalFrames) * 100,
    });
  }
}, [e2ee.encryptionStats]);
```

### 3. Fingerprint Verification Test

```typescript
// Display fingerprints for manual verification
console.log('Local Fingerprint:', e2ee.formattedLocalFingerprint);
console.log('Remote Fingerprint:', e2ee.formattedRemoteFingerprint);

// Verify they match on both sides (verbally or via separate channel)
```

---

## 📊 Monitoring & Debugging

### Enable Debug Logging

All E2EE modules log to console with prefixes:
- `🔐 E2EE:` - General E2EE operations
- `🔑 E2EE:` - Key operations
- `🔄 E2EE:` - Key rotation
- `✅ E2EE:` - Success messages
- `❌ E2EE:` - Errors
- `⚠️ E2EE:` - Warnings

### Performance Monitoring

```typescript
// Check if encryption is affecting call quality
const stats = e2ee.encryptionStats;

if (stats && stats.averageEncryptionTime > 10) {
  console.warn('High encryption latency detected:', stats.averageEncryptionTime, 'ms');
}

if (stats && stats.encryptionErrors > 0) {
  console.warn('Encryption errors detected:', stats.encryptionErrors);
}
```

---

## 🔒 Security Best Practices

1. **Always verify fingerprints** with your peer via voice or separate channel
2. **Monitor verification failures** in chat (indicates potential MITM attack)
3. **Use key rotation** for long calls (>5 minutes)
4. **Don't disable E2EE** unless user explicitly requests it
5. **Log security events** (key exchanges, verification failures)
6. **Use HTTPS** and secure WebSocket (wss://) connections
7. **Keep keys in non-extractable CryptoKey objects** (done by default)

---

## 🐛 Troubleshooting

### E2EE Status: "unsupported"

**Cause**: Browser doesn't support Insertable Streams API

**Solution**:
- Use Chrome 86+, Edge 86+, or Firefox 117+
- Safari is not yet supported

### E2EE Status: "error"

**Cause**: Key exchange failed or crypto operation error

**Solution**:
- Check console for detailed error messages
- Verify SignalR connection is active
- Ensure both peers have compatible browsers

### Chat Decryption Failed

**Cause**: Encryption key mismatch or corrupted message

**Solution**:
- Verify both peers have completed key exchange
- Check `chatE2EE.isActive` before sending messages
- Fallback to unencrypted if E2EE fails

### Signature Verification Failed

**Cause**: Peer's verification key not received or message tampered

**Solution**:
- Ensure `updatePeerVerificationKey()` was called after key exchange
- Check for MITM attacks (verify fingerprints)
- Message may be corrupted in transit

---

## 📝 Example: Complete Integration

```typescript
import React, { useEffect } from 'react';
import { Box, Alert } from '@mui/material';
import { useVideoCall } from '../hooks/useVideoCall';
import { useE2EEVideoCall } from '../hooks/useE2EEVideoCall';
import { useE2EEChat } from '../hooks/useE2EEChat';
import { E2EEStatusComponent } from '../components/videocall/E2EEStatus';
import { ChatE2EEStatusHeader, MessageE2EEIndicator } from '../components/videocall/ChatE2EEIndicator';

const VideoCallPage: React.FC = () => {
  const videoCall = useVideoCall();

  // Video E2EE
  const videoE2EE = useE2EEVideoCall({
    peerConnection: videoCall.peerConnection,
    signalRConnection: videoCall.signalRConnection,
    roomId: videoCall.roomId,
    peerId: videoCall.peerId,
    isInitiator: videoCall.isInitiator,
    autoEnable: true,
    enableKeyRotation: true,
  });

  // Chat E2EE (uses same encryption key as video)
  const chatE2EE = useE2EEChat({
    conversationId: videoCall.roomId,
    sharedEncryptionKey: videoE2EE.getCurrentKeyMaterial()?.encryptionKey || null,
    enabled: true,
    autoInitialize: true,
  });

  // Send encrypted chat message
  const handleSendMessage = async (content: string) => {
    if (!chatE2EE.isActive) {
      await videoCall.sendChatMessage(content);
      return;
    }

    try {
      const encrypted = await chatE2EE.encryptMessage(content);
      await videoCall.sendChatMessage(JSON.stringify(encrypted));
    } catch (error) {
      console.error('Encryption failed:', error);
      await videoCall.sendChatMessage(content); // Fallback
    }
  };

  // Handle received encrypted messages
  useEffect(() => {
    if (videoCall.lastMessage && videoCall.lastMessage.isEncrypted && chatE2EE.isActive) {
      const decryptMessage = async () => {
        try {
          const encrypted = JSON.parse(videoCall.lastMessage.content);
          const decrypted = await chatE2EE.decryptMessage(encrypted);
          // Display decrypted message
        } catch (error) {
          console.error('Decryption failed:', error);
        }
      };
      decryptMessage();
    }
  }, [videoCall.lastMessage, chatE2EE]);

  return (
    <Box>
      {/* E2EE Status */}
      <E2EEStatusComponent
        status={videoE2EE.e2eeStatus}
        isActive={videoE2EE.isE2EEActive}
        localFingerprint={videoE2EE.formattedLocalFingerprint}
        remoteFingerprint={videoE2EE.formattedRemoteFingerprint}
        keyGeneration={videoE2EE.keyGeneration}
        encryptionStats={videoE2EE.encryptionStats}
        errorMessage={videoE2EE.errorMessage}
        onRotateKeys={videoE2EE.rotateKeys}
      />

      {/* Video Display */}
      {/* ... */}

      {/* Chat Panel */}
      <Box>
        <ChatE2EEStatusHeader
          status={chatE2EE.status}
          isActive={chatE2EE.isActive}
          messagesEncrypted={chatE2EE.stats.messagesEncrypted}
          messagesDecrypted={chatE2EE.stats.messagesDecrypted}
          verificationFailures={chatE2EE.stats.verificationFailures}
        />
        {/* Chat messages with encryption indicators */}
      </Box>
    </Box>
  );
};

export default VideoCallPage;
```

---

## 🚀 Next Steps

1. **Integrate E2EE into existing VideoCallPage.tsx**
2. **Add SignalR Hub methods** for key exchange events
3. **Test with two browser windows** (Chrome + Firefox)
4. **Monitor encryption performance** in real calls
5. **Add user education** about E2EE and fingerprint verification
6. **Consider recording disclaimer** (E2EE prevents cloud recording)

---

**For questions or issues, see the main codebase documentation or contact the development team.**
