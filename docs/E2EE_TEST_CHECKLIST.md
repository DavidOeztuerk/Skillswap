# E2EE Integration Test Checklist

## ✅ Pre-Test Setup
- [ ] Backend services running (`docker-compose up`)
- [ ] Frontend dev server running (`npm run dev`)
- [ ] Two browser windows/tabs ready (different users)
- [ ] Browser Console open (F12) in both windows

## 🎥 Video E2EE Tests

### Visual Indicators
- [ ] **E2EE Status Badge erscheint** (top-right corner)
  - Status: "disabled" → "initializing" → "key-exchange" → "active"
  - Green lock icon when active

### Browser Console Logs (Check in BOTH browsers)
```
Expected logs:
🚀 E2EE: Initializing...
🔑 [Hub.SendKeyOffer] From {user1} to {user2}
🔑 [Hub.SendKeyAnswer] From {user2} to {user1}
✅ E2EE: Key exchange complete (generation 0)
✅ E2EE: Initialization complete
🔐 Chat E2EE: Initializing...
✅ Chat E2EE: Initialized
```

### E2EE Status Component
- [ ] Click on E2EE badge → Modal opens
- [ ] Shows "Encryption Active" with green indicator
- [ ] **Local Fingerprint** displayed (format: XXXX-XXXX-XXXX-...)
- [ ] **Remote Fingerprint** displayed (format: XXXX-XXXX-XXXX-...)
- [ ] Key Generation shows: 0 (increments after 60s)
- [ ] Encryption Stats visible:
  - Total Frames
  - Encrypted/Decrypted Frames
  - Encryption/Decryption Errors (should be 0)

### Key Rotation Test (after 60 seconds)
- [ ] Console shows: `🔄 E2EE: Key rotated to generation 1`
- [ ] E2EE Status updates to "key-rotation" briefly
- [ ] Then returns to "active"
- [ ] Key Generation in modal increases

## 💬 Chat E2EE Tests

### Chat Panel Header
- [ ] Open Chat panel (click chat icon)
- [ ] **Green "Messages are encrypted" banner** appears at top
- [ ] Stats chip shows "X msgs" count

### Send Encrypted Message
- [ ] Type message in chat: "Test encrypted message"
- [ ] Send message
- [ ] Console shows: `🔐 Encrypting message...`
- [ ] Message appears in BOTH browsers
- [ ] **Small green lock icon** next to message bubble
- [ ] Hover over lock icon → Tooltip: "Encrypted & Verified"

### Console Verification (Browser that SENT message)
```
Expected:
Chat E2EE: Encrypting message...
Stats incremented: messagesEncrypted + 1
```

### Console Verification (Browser that RECEIVED message)
```
Expected:
Chat E2EE: Decrypting message...
✅ Message verified
Stats incremented: messagesDecrypted + 1
```

### Chat E2EE Stats
- [ ] Click on stats chip in chat header
- [ ] Shows breakdown:
  - Encrypted: X
  - Decrypted: Y
  - Verification failures: 0 (should stay 0!)

## 🔴 Redux DevTools Verification

### Install Redux DevTools Extension (if not installed)
- Chrome: https://chrome.google.com/webstore/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd
- Firefox: https://addons.mozilla.org/en-US/firefox/addon/reduxdevtools/

### Check Redux State
1. Open Redux DevTools (F12 → Redux tab)
2. Navigate to State → videoCall
3. Verify E2EE state structure:

```javascript
videoCall: {
  // ... other state
  e2ee: {
    status: "active",  // Should be "active" when call is running
    localKeyFingerprint: "XXXX-XXXX-XXXX-...",
    remotePeerFingerprint: "XXXX-XXXX-XXXX-...",
    keyGeneration: 0,  // Increments every 60s
    errorMessage: null,
    encryptionStats: {
      totalFrames: 1234,
      encryptedFrames: 1234,
      decryptedFrames: 1234,
      encryptionErrors: 0,
      decryptionErrors: 0,
      averageEncryptionTime: 1.2,
      averageDecryptionTime: 0.8
    }
  },
  chatE2EE: {
    status: "active",
    localFingerprint: "XXXX...",
    peerFingerprint: null,
    stats: {
      messagesEncrypted: 5,
      messagesDecrypted: 3,
      verificationFailures: 0  // MUST be 0!
    }
  }
}
```

### Watch Redux Actions
4. In Redux DevTools, go to "Action" tab
5. Send a chat message
6. Verify actions fired:
```
- incrementChatMessagesEncrypted
- addMessage
```

## 🔥 Error Scenarios to Test

### Unsupported Browser
- [ ] Test in Safari/older browser
- [ ] E2EE Status should show: "unsupported"
- [ ] Call should still work (fallback to unencrypted)

### Network Issues
- [ ] Throttle network in DevTools (Slow 3G)
- [ ] E2EE should still establish (might be slower)
- [ ] Check for `onKeyExchangeError` in console

### One User Disconnects
- [ ] Close one browser window during call
- [ ] Other user should see "UserLeft" event
- [ ] No errors in console

## 📊 Performance Checks

### Frame Rate (Video should stay smooth)
- [ ] Open browser stats: chrome://webrtc-internals
- [ ] Check "framesPerSecond" stays ~30fps
- [ ] E2EE should NOT cause frame drops

### Memory Usage
- [ ] Open Task Manager
- [ ] Monitor browser memory during call
- [ ] Should stay reasonable (~500MB per tab)

### CPU Usage
- [ ] E2EE encryption runs in Web Workers (background)
- [ ] CPU should stay manageable (~20-40% per tab)

## 🐛 Common Issues & Solutions

### E2EE Status stays "initializing"
- **Check**: Browser console for errors
- **Fix**: Refresh both browsers, try again

### No remote fingerprint shown
- **Check**: SignalR connection established?
- **Check**: Backend logs for `SendKeyOffer/SendKeyAnswer`
- **Fix**: Restart backend, ensure Hub methods exist

### Chat messages not encrypted
- **Check**: Chat E2EE status - should be "active"
- **Check**: Video E2EE must be active FIRST (chat uses video keys)
- **Fix**: Wait for video E2EE to establish

### Verification failures > 0
- **This is BAD!** Means messages tampered or wrong keys
- **Check**: Browser console for "signature verification failed"
- **Fix**: Restart call, check for MITM

## ✅ Success Criteria

All of these must be TRUE:
- ✅ E2EE Status shows "active" in both browsers
- ✅ Local + Remote fingerprints visible
- ✅ Chat messages show lock icon
- ✅ Verification failures = 0
- ✅ No encryption/decryption errors
- ✅ Video plays smoothly (~30fps)
- ✅ Redux state matches expected structure
- ✅ Console shows successful key exchange

---

## 🎯 Quick Manual Test (5 min)

1. Start services, open 2 browsers
2. Create appointment, join call from both sides
3. Wait 5 seconds → Check E2EE badge is green
4. Send 3 chat messages from each side
5. Open E2EE modal → verify fingerprints match
6. Check Redux DevTools → verify state structure
7. ✅ DONE!

If all above works → E2EE is FULLY FUNCTIONAL! 🎉
