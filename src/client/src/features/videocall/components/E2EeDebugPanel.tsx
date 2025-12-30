// import React, { useState, useMemo, useCallback, type JSX } from 'react';
// import {
//   Security as SecurityIcon,
//   ExpandMore as ExpandMoreIcon,
//   ExpandLess as ExpandLessIcon,
//   CheckCircle as CheckCircleIcon,
//   Warning as WarningIcon,
//   Error as ErrorIcon,
//   Info as InfoIcon,
//   Refresh as RefreshIcon,
//   ContentCopy as CopyIcon,
//   Fingerprint as FingerprintIcon,
//   VpnKey as KeyIcon,
//   Timeline as TimelineIcon,
//   PlayArrow as PlayArrowIcon,
//   Science as ScienceIcon,
// } from '@mui/icons-material';
// import {
//   Box,
//   Paper,
//   Typography,
//   Collapse,
//   IconButton,
//   Chip,
//   LinearProgress,
//   Tooltip,
//   Divider,
//   Alert,
//   useTheme,
//   type Theme,
//   Tabs,
//   Tab,
//   Button,
//   CircularProgress,
// } from '@mui/material';
// import {
//   type E2EECapabilities,
//   getE2EECapabilities,
//   getBrowserInfo,
// } from '../../../shared/detection';
// import type { ChatE2EEStatus, E2EEStatus } from '../hooks/types';
// import type { EncryptionStats } from '../store/videoCallAdapter+State';

// // ============================================================================
// // Constants
// // ============================================================================

// const TEXT_SECONDARY = 'text.secondary';
// const JUSTIFY_SPACE_BETWEEN = 'space-between';
// // eslint-disable-next-line sonarjs/no-duplicate-string -- Same literals required in switch cases for exhaustiveness
// const TRANSITIONAL_STATES = new Set<E2EEStatus>(['initializing', 'key-exchange', 'key-rotation']);

// // ============================================================================
// // Types
// // ============================================================================

// interface E2EEDebugPanelProps {
//   // Video E2EE
//   status: E2EEStatus;
//   localFingerprint: string | null;
//   remoteFingerprint: string | null;
//   keyGeneration: number;
//   encryptionStats: EncryptionStats | null;
//   errorMessage: string | null;
//   onRotateKeys?: () => void;

//   // Chat E2EE
//   chatStatus: ChatE2EEStatus;
//   chatLocalFingerprint: string | null;
//   chatStats: {
//     messagesEncrypted: number;
//     messagesDecrypted: number;
//     verificationFailures: number;
//   } | null;

//   // Optional: Compact mode for smaller displays
//   compact?: boolean;
// }

// // ============================================================================
// // Helper Functions
// // ============================================================================

// function formatFingerprint(fp: string | null): string {
//   if (!fp) return '—';
//   // Format: XXXX-XXXX-XXXX-XXXX
//   const clean = fp.replaceAll(/[^a-fA-F0-9]/g, '').toUpperCase();
//   if (clean.length < 16) return fp;
//   return `${clean.slice(0, 4)}-${clean.slice(4, 8)}-${clean.slice(8, 12)}-${clean.slice(12, 16)}`;
// }

// function getStatusColor(
//   status: E2EEStatus | ChatE2EEStatus
// ): 'success' | 'warning' | 'error' | 'info' | 'default' {
//   switch (status) {
//     case 'active':
//     case 'verified':
//       return 'success';
//     case 'initializing':
//     case 'key-exchange':
//     case 'key-rotation':
//       return 'info';
//     case 'error':
//       return 'error';
//     case 'unsupported':
//       return 'warning';
//     case 'inactive':
//     case 'disabled':
//       return 'default';
//     default: {
//       const _exhaustiveCheck: never = status;
//       return _exhaustiveCheck;
//     }
//   }
// }

// function getStatusIcon(status: E2EEStatus | ChatE2EEStatus): JSX.Element {
//   switch (status) {
//     case 'active':
//     case 'verified':
//       return <CheckCircleIcon fontSize="small" />;
//     case 'initializing':
//     case 'key-exchange':
//     case 'key-rotation':
//       return <InfoIcon fontSize="small" />;
//     case 'error':
//       return <ErrorIcon fontSize="small" />;
//     case 'unsupported':
//       return <WarningIcon fontSize="small" />;
//     case 'inactive':
//     case 'disabled':
//       return <SecurityIcon fontSize="small" />;
//     default: {
//       const _exhaustiveCheck: never = status;
//       return _exhaustiveCheck;
//     }
//   }
// }

// function getStatusLabel(status: E2EEStatus | ChatE2EEStatus): string {
//   switch (status) {
//     case 'inactive':
//     case 'disabled':
//       return 'Deaktiviert';
//     case 'initializing':
//       return 'Initialisierung...';
//     case 'key-exchange':
//       return 'Schlüsselaustausch...';
//     case 'active':
//       return 'Aktiv';
//     case 'verified':
//       return 'Verifiziert';
//     case 'key-rotation':
//       return 'Schlüsselrotation...';
//     case 'error':
//       return 'Fehler';
//     case 'unsupported':
//       return 'Nicht unterstützt';
//     default: {
//       const _exhaustiveCheck: never = status;
//       return _exhaustiveCheck;
//     }
//   }
// }

// function getBorderColor(isActive: boolean, hasError: boolean, theme: Theme): string {
//   if (isActive) return theme.palette.success.main;
//   if (hasError) return theme.palette.error.main;
//   return theme.palette.divider;
// }

// function getSecurityIconColor(
//   isActive: boolean,
//   hasError: boolean
// ): 'success' | 'error' | 'action' {
//   if (isActive) return 'success';
//   if (hasError) return 'error';
//   return 'action';
// }

// function getHealthColor(health: number): 'success' | 'warning' | 'error' {
//   if (health > 95) return 'success';
//   if (health > 80) return 'warning';
//   return 'error';
// }

// // ============================================================================
// // Sub-Components
// // ============================================================================

// interface StatItemProps {
//   label: string;
//   value: number | string;
//   color?: 'success' | 'error' | 'info' | 'warning';
// }

// const StatItem: React.FC<StatItemProps> = ({ label, value, color }) => {
//   const theme = useTheme();
//   const textColor = color === undefined ? 'text.primary' : `${color}.main`;

//   return (
//     <Box
//       sx={{
//         p: 0.75,
//         bgcolor: theme.palette.action.hover,
//         borderRadius: 0.5,
//         textAlign: 'center',
//       }}
//     >
//       <Typography
//         variant="caption"
//         color={TEXT_SECONDARY}
//         sx={{ display: 'block', fontSize: '0.65rem' }}
//       >
//         {label}
//       </Typography>
//       <Typography variant="body2" fontWeight="bold" color={textColor} sx={{ fontSize: '0.8rem' }}>
//         {typeof value === 'number' ? value.toLocaleString() : value}
//       </Typography>
//     </Box>
//   );
// };

// interface FingerprintDisplayProps {
//   label: string;
//   fingerprint: string | null;
//   copyLabel: string;
//   copied: string | null;
//   onCopy: (text: string, label: string) => void;
//   activeColor: string;
// }

// const FingerprintDisplay: React.FC<FingerprintDisplayProps> = ({
//   label,
//   fingerprint,
//   copyLabel,
//   copied,
//   onCopy,
//   activeColor,
// }) => {
//   const theme = useTheme();

//   return (
//     <Box sx={{ mt: 1, p: 1, bgcolor: theme.palette.action.hover, borderRadius: 1 }}>
//       <Box sx={{ display: 'flex', justifyContent: JUSTIFY_SPACE_BETWEEN, alignItems: 'center' }}>
//         <Typography variant="caption" color={TEXT_SECONDARY}>
//           {label}
//         </Typography>
//         {fingerprint ? (
//           <Tooltip title={copied === copyLabel ? 'Kopiert!' : 'Kopieren'}>
//             <IconButton
//               size="small"
//               onClick={(e) => {
//                 e.stopPropagation();
//                 onCopy(fingerprint, copyLabel);
//               }}
//             >
//               <CopyIcon fontSize="inherit" />
//             </IconButton>
//           </Tooltip>
//         ) : null}
//       </Box>
//       <Typography
//         variant="body2"
//         fontFamily="monospace"
//         fontWeight="bold"
//         color={fingerprint ? activeColor : 'text.disabled'}
//       >
//         {formatFingerprint(fingerprint)}
//       </Typography>
//     </Box>
//   );
// };

// interface EncryptionStatsSectionProps {
//   encryptionStats: EncryptionStats;
//   encryptionHealth: number | null;
// }

// const EncryptionStatsSection: React.FC<EncryptionStatsSectionProps> = ({
//   encryptionStats,
//   encryptionHealth,
// }) => {
//   const errorCount = encryptionStats.encryptionErrors + encryptionStats.decryptionErrors;

//   return (
//     <Box sx={{ mb: 2 }}>
//       <Typography
//         variant="caption"
//         color={TEXT_SECONDARY}
//         gutterBottom
//         sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
//       >
//         <TimelineIcon fontSize="inherit" />
//         Verschlüsselungs-Statistik
//       </Typography>

//       {encryptionHealth === null ? (
//         encryptionStats.totalFrames > 0 ? (
//           <Box sx={{ mt: 1 }}>
//             <Box sx={{ display: 'flex', justifyContent: JUSTIFY_SPACE_BETWEEN, mb: 0.5 }}>
//               <Typography variant="caption">Encryption Health</Typography>
//               <Typography variant="caption" fontWeight="bold" color="info.main">
//                 Initialisierung...
//               </Typography>
//             </Box>
//             <LinearProgress color="info" sx={{ height: 6, borderRadius: 1 }} />
//           </Box>
//         ) : null
//       ) : (
//         <Box sx={{ mt: 1 }}>
//           <Box sx={{ display: 'flex', justifyContent: JUSTIFY_SPACE_BETWEEN, mb: 0.5 }}>
//             <Typography variant="caption">Encryption Health</Typography>
//             <Typography variant="caption" fontWeight="bold">
//               {encryptionHealth.toFixed(1)}%
//             </Typography>
//           </Box>
//           <LinearProgress
//             variant="determinate"
//             value={encryptionHealth}
//             color={getHealthColor(encryptionHealth)}
//             sx={{ height: 6, borderRadius: 1 }}
//           />
//         </Box>
//       )}

//       <Box
//         sx={{
//           mt: 1,
//           display: 'grid',
//           gridTemplateColumns: '1fr 1fr',
//           gap: 1,
//           fontSize: '0.75rem',
//         }}
//       >
//         <StatItem label="Frames gesamt" value={encryptionStats.totalFrames} />
//         <StatItem label="Verschlüsselt" value={encryptionStats.encryptedFrames} color="success" />
//         <StatItem label="Entschlüsselt" value={encryptionStats.decryptedFrames} color="info" />
//         <StatItem label="Fehler" value={errorCount} color={errorCount > 0 ? 'error' : undefined} />
//         <StatItem
//           label="Ø Encrypt"
//           value={`${encryptionStats.averageEncryptionTime.toFixed(2)}ms`}
//         />
//         <StatItem
//           label="Ø Decrypt"
//           value={`${encryptionStats.averageDecryptionTime.toFixed(2)}ms`}
//         />
//       </Box>

//       {encryptionStats.lastKeyRotation ? (
//         <Typography variant="caption" color={TEXT_SECONDARY} sx={{ mt: 1, display: 'block' }}>
//           Letzte Rotation: {new Date(encryptionStats.lastKeyRotation).toLocaleTimeString()}
//         </Typography>
//       ) : null}
//     </Box>
//   );
// };

// interface ChatE2EESectionProps {
//   chatStatus: ChatE2EEStatus;
//   chatStats: {
//     messagesEncrypted: number;
//     messagesDecrypted: number;
//     verificationFailures: number;
//   } | null;
// }

// const ChatE2EESection: React.FC<ChatE2EESectionProps> = ({ chatStatus, chatStats }) => (
//   <Box>
//     <Typography
//       variant="caption"
//       color={TEXT_SECONDARY}
//       gutterBottom
//       sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
//     >
//       <SecurityIcon fontSize="inherit" />
//       Chat-Verschlüsselung
//     </Typography>

//     <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
//       <Chip
//         size="small"
//         icon={getStatusIcon(chatStatus)}
//         label={getStatusLabel(chatStatus)}
//         color={getStatusColor(chatStatus)}
//         sx={{ height: 22 }}
//       />
//     </Box>

//     {chatStats ? (
//       <Box
//         sx={{
//           mt: 1,
//           display: 'grid',
//           gridTemplateColumns: '1fr 1fr 1fr',
//           gap: 1,
//           fontSize: '0.75rem',
//         }}
//       >
//         <StatItem label="Gesendet" value={chatStats.messagesEncrypted} color="success" />
//         <StatItem label="Empfangen" value={chatStats.messagesDecrypted} color="info" />
//         <StatItem
//           label="Fehler"
//           value={chatStats.verificationFailures}
//           color={chatStats.verificationFailures > 0 ? 'error' : undefined}
//         />
//       </Box>
//     ) : null}
//   </Box>
// );

// // ============================================================================
// // E2EE Verification Tests
// // ============================================================================

// interface TestResult {
//   name: string;
//   status: 'pending' | 'running' | 'passed' | 'failed';
//   duration?: number;
//   details?: string;
//   error?: string;
// }

// interface E2EEVerificationTestsProps {
//   compact?: boolean;
// }

// const E2EEVerificationTests: React.FC<E2EEVerificationTestsProps> = ({ compact }) => {
//   const theme = useTheme();
//   const [tests, setTests] = useState<TestResult[]>([
//     // Crypto API Tests
//     { name: 'ECDH Key Exchange (P-256)', status: 'pending' },
//     { name: 'AES-GCM Encryption (256-bit)', status: 'pending' },
//     { name: 'AES-GCM Decryption', status: 'pending' },
//     { name: 'Frame Encryption (Video 1KB)', status: 'pending' },
//     { name: 'Frame Encryption (Video 100KB)', status: 'pending' },
//     { name: 'ECDSA Signing (P-256)', status: 'pending' },
//     { name: 'ECDSA Verification', status: 'pending' },
//     { name: 'WebRTC E2EE API Support', status: 'pending' },
//     // Performance Tests (Chrome vs Safari comparison)
//     { name: 'Message Latency (50 iterations)', status: 'pending' },
//     { name: 'Frame Pipeline (15KB, 50 frames)', status: 'pending' },
//     { name: 'Concurrent Crypto Operations', status: 'pending' },
//     { name: 'Memory Allocation Test', status: 'pending' },
//   ]);
//   const [isRunning, setIsRunning] = useState(false);
//   const [allTestsComplete, setAllTestsComplete] = useState(false);

//   const updateTest = useCallback((index: number, update: Partial<TestResult>) => {
//     setTests((prev) => prev.map((t, i) => (i === index ? { ...t, ...update } : t)));
//   }, []);

//   // eslint-disable-next-line sonarjs/cognitive-complexity -- Test runner function, complexity is inherent
//   const runTests = useCallback(async () => {
//     setIsRunning(true);
//     setAllTestsComplete(false);

//     // Reset all tests
//     setTests((prev) =>
//       prev.map((t) => ({ ...t, status: 'pending', duration: undefined, error: undefined }))
//     );

//     let testIndex = 0;

//     // Test 1: ECDH Key Exchange
//     updateTest(testIndex, { status: 'running' });
//     try {
//       const start = performance.now();
//       const keyPairA = await crypto.subtle.generateKey(
//         { name: 'ECDH', namedCurve: 'P-256' },
//         true,
//         ['deriveBits']
//       );
//       const keyPairB = await crypto.subtle.generateKey(
//         { name: 'ECDH', namedCurve: 'P-256' },
//         true,
//         ['deriveBits']
//       );
//       const sharedA = await crypto.subtle.deriveBits(
//         { name: 'ECDH', public: keyPairB.publicKey },
//         keyPairA.privateKey,
//         256
//       );
//       const sharedB = await crypto.subtle.deriveBits(
//         { name: 'ECDH', public: keyPairA.publicKey },
//         keyPairB.privateKey,
//         256
//       );
//       const match = new Uint8Array(sharedA).every((v, i) => v === new Uint8Array(sharedB)[i]);
//       const duration = performance.now() - start;
//       updateTest(testIndex, {
//         status: match ? 'passed' : 'failed',
//         duration,
//         details: `Shared secret: ${sharedA.byteLength * 8} bits`,
//         error: match ? undefined : 'Keys do not match',
//       });
//     } catch (e) {
//       updateTest(testIndex, { status: 'failed', error: String(e) });
//     }
//     testIndex++;

//     // Test 2: AES-GCM Encryption
//     updateTest(testIndex, { status: 'running' });
//     let aesKey: CryptoKey | null = null;
//     let encryptedData: ArrayBuffer | null = null;
//     let ivBuffer: ArrayBuffer | null = null;
//     const testData = new Uint8Array(1024).fill(42);
//     try {
//       const start = performance.now();
//       aesKey = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, [
//         'encrypt',
//         'decrypt',
//       ]);
//       const ivArray = new Uint8Array(12);
//       crypto.getRandomValues(ivArray);
//       ivBuffer = ivArray.buffer;
//       encryptedData = await crypto.subtle.encrypt(
//         { name: 'AES-GCM', iv: ivBuffer },
//         aesKey,
//         testData
//       );
//       const duration = performance.now() - start;
//       updateTest(testIndex, {
//         status: 'passed',
//         duration,
//         details: `Encrypted ${testData.length} → ${encryptedData.byteLength} bytes`,
//       });
//     } catch (e) {
//       updateTest(testIndex, { status: 'failed', error: String(e) });
//     }
//     testIndex++;

//     // Test 3: AES-GCM Decryption
//     updateTest(testIndex, { status: 'running' });
//     try {
//       if (!aesKey || !encryptedData || !ivBuffer) throw new Error('Missing encryption data');
//       const start = performance.now();
//       const decrypted = await crypto.subtle.decrypt(
//         { name: 'AES-GCM', iv: ivBuffer },
//         aesKey,
//         encryptedData
//       );
//       const duration = performance.now() - start;
//       const decryptedArray = new Uint8Array(decrypted);
//       const match = decryptedArray.every((v, i) => v === testData[i]);
//       updateTest(testIndex, {
//         status: match ? 'passed' : 'failed',
//         duration,
//         details: `Decrypted ${encryptedData.byteLength} → ${decrypted.byteLength} bytes`,
//         error: match ? undefined : 'Data mismatch after decryption',
//       });
//     } catch (e) {
//       updateTest(testIndex, { status: 'failed', error: String(e) });
//     }
//     testIndex++;

//     // Test 4: Frame Encryption (1KB video frame)
//     updateTest(testIndex, { status: 'running' });
//     try {
//       const frameData = crypto.getRandomValues(new Uint8Array(1024));
//       const start = performance.now();
//       const frameKey = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, [
//         'encrypt',
//         'decrypt',
//       ]);
//       const frameIv = crypto.getRandomValues(new Uint8Array(12));
//       const encrypted = await crypto.subtle.encrypt(
//         { name: 'AES-GCM', iv: frameIv },
//         frameKey,
//         frameData
//       );
//       const decrypted = await crypto.subtle.decrypt(
//         { name: 'AES-GCM', iv: frameIv },
//         frameKey,
//         encrypted
//       );
//       const duration = performance.now() - start;
//       updateTest(testIndex, {
//         status: 'passed',
//         duration,
//         details: `1KB frame: ${duration.toFixed(2)}ms round-trip`,
//       });
//       void decrypted; // Use the variable
//     } catch (e) {
//       updateTest(testIndex, { status: 'failed', error: String(e) });
//     }
//     testIndex++;

//     // Test 5: Frame Encryption (100KB video frame - typical I-frame)
//     // Note: crypto.getRandomValues() has a 64KB limit, so we fill in chunks
//     updateTest(testIndex, { status: 'running' });
//     try {
//       // Create 100KB buffer by filling in 64KB chunks (browser limit workaround)
//       const frameData = new Uint8Array(102400);
//       const chunkSize = 65536; // Max allowed by getRandomValues
//       for (let offset = 0; offset < frameData.length; offset += chunkSize) {
//         const chunk = frameData.subarray(offset, Math.min(offset + chunkSize, frameData.length));
//         crypto.getRandomValues(chunk);
//       }
//       const start = performance.now();
//       const frameKey = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, [
//         'encrypt',
//         'decrypt',
//       ]);
//       const frameIv = crypto.getRandomValues(new Uint8Array(12));
//       const encrypted = await crypto.subtle.encrypt(
//         { name: 'AES-GCM', iv: frameIv },
//         frameKey,
//         frameData
//       );
//       const decrypted = await crypto.subtle.decrypt(
//         { name: 'AES-GCM', iv: frameIv },
//         frameKey,
//         encrypted
//       );
//       const duration = performance.now() - start;
//       updateTest(testIndex, {
//         status: 'passed',
//         duration,
//         details: `100KB frame: ${duration.toFixed(2)}ms round-trip`,
//       });
//       void decrypted;
//     } catch (e) {
//       updateTest(testIndex, { status: 'failed', error: String(e) });
//     }
//     testIndex++;

//     // Test 6: ECDSA Signing
//     updateTest(testIndex, { status: 'running' });
//     let signingKeyPair: CryptoKeyPair | null = null;
//     let signature: ArrayBuffer | null = null;
//     const messageToSign = new TextEncoder().encode('E2EE verification test message');
//     try {
//       const start = performance.now();
//       signingKeyPair = await crypto.subtle.generateKey(
//         { name: 'ECDSA', namedCurve: 'P-256' },
//         true,
//         ['sign', 'verify']
//       );
//       signature = await crypto.subtle.sign(
//         { name: 'ECDSA', hash: 'SHA-256' },
//         signingKeyPair.privateKey,
//         messageToSign
//       );
//       const duration = performance.now() - start;
//       updateTest(testIndex, {
//         status: 'passed',
//         duration,
//         details: `Signature: ${signature.byteLength} bytes`,
//       });
//     } catch (e) {
//       updateTest(testIndex, { status: 'failed', error: String(e) });
//     }
//     testIndex++;

//     // Test 7: ECDSA Verification
//     updateTest(testIndex, { status: 'running' });
//     try {
//       if (!signingKeyPair || !signature) throw new Error('Missing signing data');
//       const start = performance.now();
//       const valid = await crypto.subtle.verify(
//         { name: 'ECDSA', hash: 'SHA-256' },
//         signingKeyPair.publicKey,
//         signature,
//         messageToSign
//       );
//       const duration = performance.now() - start;
//       updateTest(testIndex, {
//         status: valid ? 'passed' : 'failed',
//         duration,
//         details: valid ? 'Signature valid' : 'Signature invalid',
//         error: valid ? undefined : 'Verification failed',
//       });
//     } catch (e) {
//       updateTest(testIndex, { status: 'failed', error: String(e) });
//     }
//     testIndex++;

//     // Test 8: WebRTC E2EE API Support
//     updateTest(testIndex, { status: 'running' });
//     try {
//       const start = performance.now();
//       const hasInsertableStreams =
//         'RTCRtpSender' in window && 'createEncodedStreams' in RTCRtpSender.prototype;
//       const hasScriptTransform = 'RTCRtpScriptTransform' in window;
//       const hasTransformStream = 'TransformStream' in window;
//       const duration = performance.now() - start;

//       const supportedMethods: string[] = [];
//       if (hasInsertableStreams) supportedMethods.push('EncodedStreams');
//       if (hasScriptTransform) supportedMethods.push('ScriptTransform');
//       if (hasTransformStream) supportedMethods.push('TransformStream');

//       const supported = hasInsertableStreams || hasScriptTransform;
//       updateTest(testIndex, {
//         status: supported ? 'passed' : 'failed',
//         duration,
//         details: supportedMethods.length > 0 ? supportedMethods.join(', ') : 'None',
//         error: supported ? undefined : 'No E2EE API available',
//       });
//     } catch (e) {
//       updateTest(testIndex, { status: 'failed', error: String(e) });
//     }
//     testIndex++;

//     // Test 9: Message Latency (50 iterations) - simulates Chrome's postMessage overhead
//     updateTest(testIndex, { status: 'running' });
//     try {
//       const iterations = 50;
//       const latencies: number[] = [];

//       // Sequential message passing to measure individual latency
//       /* eslint-disable no-await-in-loop -- Intentional: measuring sequential latency accurately */
//       for (let i = 0; i < iterations; i++) {
//         const channel = new MessageChannel();
//         const start = performance.now();

//         await new Promise<void>((resolve) => {
//           channel.port2.addEventListener('message', () => {
//             latencies.push(performance.now() - start);
//             channel.port1.close();
//             channel.port2.close();
//             resolve();
//           });
//           channel.port2.start();
//           channel.port1.postMessage({ index: i, data: new Uint8Array(1024) });
//         });
//       }
//       /* eslint-enable no-await-in-loop */

//       const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
//       const maxLatency = Math.max(...latencies);
//       const passed = avgLatency < 2; // Pass if avg < 2ms

//       updateTest(testIndex, {
//         status: passed ? 'passed' : 'failed',
//         duration: avgLatency,
//         details: `Avg: ${avgLatency.toFixed(2)}ms, Max: ${maxLatency.toFixed(2)}ms`,
//         error: passed ? undefined : `Avg latency ${avgLatency.toFixed(2)}ms > 2ms threshold`,
//       });
//     } catch (e) {
//       updateTest(testIndex, { status: 'failed', error: String(e) });
//     }
//     testIndex++;

//     // Test 10: Frame Pipeline (15KB, 50 frames) - realistic video frame throughput
//     updateTest(testIndex, { status: 'running' });
//     try {
//       const frameSize = 15360; // 15KB typical P-frame
//       const frameCount = 50;
//       const frameKey = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, [
//         'encrypt',
//         'decrypt',
//       ]);

//       const durations: number[] = [];

//       /* eslint-disable no-await-in-loop -- Intentional: measuring sequential frame throughput */
//       for (let i = 0; i < frameCount; i++) {
//         const frameData = new Uint8Array(frameSize);
//         crypto.getRandomValues(frameData);
//         const frameIv = crypto.getRandomValues(new Uint8Array(12));

//         const start = performance.now();
//         const encrypted = await crypto.subtle.encrypt(
//           { name: 'AES-GCM', iv: frameIv },
//           frameKey,
//           frameData
//         );
//         await crypto.subtle.decrypt({ name: 'AES-GCM', iv: frameIv }, frameKey, encrypted);
//         durations.push(performance.now() - start);
//       }
//       /* eslint-enable no-await-in-loop */

//       const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
//       const maxDuration = Math.max(...durations);
//       const passed = avgDuration < 5 && maxDuration < 15; // Avg < 5ms, Max < 15ms

//       updateTest(testIndex, {
//         status: passed ? 'passed' : 'failed',
//         duration: avgDuration,
//         details: `${frameCount}x 15KB: Avg ${avgDuration.toFixed(2)}ms, Max ${maxDuration.toFixed(2)}ms`,
//         error: passed ? undefined : `Performance below threshold (avg < 5ms, max < 15ms)`,
//       });
//     } catch (e) {
//       updateTest(testIndex, { status: 'failed', error: String(e) });
//     }
//     testIndex++;

//     // Test 11: Concurrent Crypto Operations - tests parallel processing capability
//     updateTest(testIndex, { status: 'running' });
//     try {
//       const concurrentOps = 10;
//       const testKeys = await Promise.all(
//         Array.from({ length: concurrentOps }, () =>
//           crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt'])
//         )
//       );

//       const start = performance.now();

//       // Run encrypt and decrypt operations concurrently
//       const operations = testKeys.map(async (key) => {
//         const data = new Uint8Array(5120); // 5KB per operation
//         crypto.getRandomValues(data);
//         const opIv = crypto.getRandomValues(new Uint8Array(12));
//         const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: opIv }, key, data);
//         return crypto.subtle.decrypt({ name: 'AES-GCM', iv: opIv }, key, encrypted);
//       });

//       await Promise.all(operations);
//       const duration = performance.now() - start;
//       const avgPerOp = duration / concurrentOps;
//       const passed = avgPerOp < 3; // Pass if < 3ms per concurrent operation

//       updateTest(testIndex, {
//         status: passed ? 'passed' : 'failed',
//         duration,
//         details: `${concurrentOps} concurrent ops: ${duration.toFixed(2)}ms total, ${avgPerOp.toFixed(2)}ms/op`,
//         error: passed ? undefined : `Concurrent performance below threshold`,
//       });
//     } catch (e) {
//       updateTest(testIndex, { status: 'failed', error: String(e) });
//     }
//     testIndex++;

//     // Test 12: Memory Allocation Test - checks for memory pressure during crypto ops
//     updateTest(testIndex, { status: 'running' });
//     try {
//       const iterations = 100;
//       const memoryBefore = (performance as unknown as { memory?: { usedJSHeapSize: number } })
//         .memory?.usedJSHeapSize;

//       const start = performance.now();
//       /* eslint-disable no-await-in-loop -- Intentional: measuring memory pressure under sequential load */
//       for (let i = 0; i < iterations; i++) {
//         const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, [
//           'encrypt',
//           'decrypt',
//         ]);
//         const data = new Uint8Array(10240); // 10KB
//         crypto.getRandomValues(data);
//         const memIv = crypto.getRandomValues(new Uint8Array(12));
//         const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: memIv }, key, data);
//         await crypto.subtle.decrypt({ name: 'AES-GCM', iv: memIv }, key, encrypted);
//       }
//       /* eslint-enable no-await-in-loop */
//       const duration = performance.now() - start;

//       const memoryAfter = (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory
//         ?.usedJSHeapSize;

//       let details = `${iterations} iterations: ${duration.toFixed(2)}ms`;
//       if (memoryBefore !== undefined && memoryAfter !== undefined) {
//         const memoryDelta = (memoryAfter - memoryBefore) / 1024 / 1024;
//         details += `, Memory Δ: ${memoryDelta.toFixed(2)}MB`;
//       } else {
//         details += ' (Memory API not available)';
//       }

//       updateTest(testIndex, {
//         status: 'passed',
//         duration,
//         details,
//       });
//     } catch (e) {
//       updateTest(testIndex, { status: 'failed', error: String(e) });
//     }

//     setIsRunning(false);
//     setAllTestsComplete(true);
//   }, [updateTest]);

//   const passedCount = tests.filter((t) => t.status === 'passed').length;
//   const failedCount = tests.filter((t) => t.status === 'failed').length;

//   return (
//     <Box sx={{ p: compact ? 1 : 1.5 }}>
//       <Box
//         sx={{
//           display: 'flex',
//           justifyContent: JUSTIFY_SPACE_BETWEEN,
//           alignItems: 'center',
//           mb: 1.5,
//         }}
//       >
//         <Typography
//           variant="caption"
//           color={TEXT_SECONDARY}
//           sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
//         >
//           <ScienceIcon fontSize="inherit" />
//           E2EE Crypto Verification
//         </Typography>
//         <Button
//           size="small"
//           variant="contained"
//           color="primary"
//           startIcon={isRunning ? <CircularProgress size={14} color="inherit" /> : <PlayArrowIcon />}
//           onClick={runTests}
//           disabled={isRunning}
//           sx={{ minWidth: 90, height: 28, fontSize: '0.7rem' }}
//         >
//           {isRunning ? 'Läuft...' : 'Tests starten'}
//         </Button>
//       </Box>

//       {allTestsComplete ? (
//         <Alert severity={failedCount === 0 ? 'success' : 'warning'} sx={{ mb: 1.5, py: 0.25 }}>
//           <Typography variant="caption">
//             {passedCount}/{tests.length} Tests bestanden
//             {failedCount > 0 && ` • ${failedCount} fehlgeschlagen`}
//           </Typography>
//         </Alert>
//       ) : null}

//       <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
//         {tests.map((test) => (
//           <Box
//             key={test.name}
//             sx={{
//               p: 0.75,
//               bgcolor: theme.palette.action.hover,
//               borderRadius: 0.5,
//               borderLeft: `3px solid ${
//                 test.status === 'passed'
//                   ? theme.palette.success.main
//                   : test.status === 'failed'
//                     ? theme.palette.error.main
//                     : test.status === 'running'
//                       ? theme.palette.info.main
//                       : theme.palette.divider
//               }`,
//             }}
//           >
//             <Box
//               sx={{ display: 'flex', justifyContent: JUSTIFY_SPACE_BETWEEN, alignItems: 'center' }}
//             >
//               <Typography variant="caption" fontWeight="medium" sx={{ fontSize: '0.7rem' }}>
//                 {test.name}
//               </Typography>
//               <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
//                 {test.duration !== undefined && (
//                   <Typography variant="caption" color={TEXT_SECONDARY} sx={{ fontSize: '0.65rem' }}>
//                     {test.duration.toFixed(1)}ms
//                   </Typography>
//                 )}
//                 {test.status === 'running' && <CircularProgress size={12} />}
//                 {test.status === 'passed' && (
//                   <CheckCircleIcon fontSize="inherit" color="success" sx={{ fontSize: 14 }} />
//                 )}
//                 {test.status === 'failed' && (
//                   <ErrorIcon fontSize="inherit" color="error" sx={{ fontSize: 14 }} />
//                 )}
//               </Box>
//             </Box>
//             {test.details ? (
//               <Typography
//                 variant="caption"
//                 color={TEXT_SECONDARY}
//                 sx={{ fontSize: '0.6rem', display: 'block', mt: 0.25 }}
//               >
//                 {test.details}
//               </Typography>
//             ) : null}
//             {test.error ? (
//               <Typography
//                 variant="caption"
//                 color="error"
//                 sx={{ fontSize: '0.6rem', display: 'block', mt: 0.25 }}
//               >
//                 {test.error}
//               </Typography>
//             ) : null}
//           </Box>
//         ))}
//       </Box>

//       <Divider sx={{ my: 1.5 }} />

//       <Typography variant="caption" color={TEXT_SECONDARY} sx={{ fontSize: '0.65rem' }}>
//         Diese Tests verifizieren die Browser-Crypto-APIs, die für E2EE verwendet werden. Alle Tests
//         sollten bestanden werden für vollständige E2EE-Unterstützung.
//       </Typography>
//     </Box>
//   );
// };

// const E2EEDebugPanel: React.FC<E2EEDebugPanelProps> = ({
//   status,
//   localFingerprint,
//   remoteFingerprint,
//   keyGeneration,
//   encryptionStats,
//   errorMessage,
//   onRotateKeys,
//   chatStatus,
//   chatLocalFingerprint: _chatLocalFingerprint, // Reserved for future use
//   chatStats,
//   compact = false,
// }) => {
//   const theme = useTheme();
//   const [expanded, setExpanded] = useState(!compact);
//   const [copied, setCopied] = useState<string | null>(null);
//   const [activeTab, setActiveTab] = useState(0);
//   // e2eeCaps is read-only after initialization, setter not needed
//   const e2eeCaps = useMemo<E2EECapabilities>(() => getE2EECapabilities(), []);
//   const browserInfo = useMemo(() => getBrowserInfo(), []);

//   // Calculate encryption health percentage
//   // Fixed: Use error ratio based on processed frames, not total frames
//   // This avoids showing 0% when passthrough frames are counted but encryption isn't active yet
//   const encryptionHealth = useMemo(() => {
//     if (!encryptionStats || encryptionStats.totalFrames === 0) return null;

//     // Check if we have actual encryption/decryption activity
//     const hasActivity = encryptionStats.decryptedFrames > 0 || encryptionStats.encryptedFrames > 0;

//     // If frames are flowing but no E2EE activity yet, return null to show "Initializing..."
//     if (!hasActivity && encryptionStats.totalFrames > 0) {
//       return null;
//     }

//     // Calculate based on processed frames and error ratio
//     const processedFrames = encryptionStats.encryptedFrames + encryptionStats.decryptedFrames;
//     const totalErrors = encryptionStats.encryptionErrors + encryptionStats.decryptionErrors;
//     const errorRatio = totalErrors / Math.max(processedFrames, 1);

//     // Health = 100% - error percentage
//     return Math.max(0, Math.min(100, (1 - errorRatio) * 100));
//   }, [encryptionStats]);

//   const handleCopy = async (text: string, label: string): Promise<void> => {
//     try {
//       await navigator.clipboard.writeText(text);
//       setCopied(label);
//       setTimeout(() => {
//         setCopied(null);
//       }, 2000);
//     } catch (e) {
//       console.error('Copy failed:', e);
//     }
//   };

//   const isActive = status === 'active';
//   const hasError = status === 'error' || status === 'unsupported';
//   const borderColor = getBorderColor(isActive, hasError, theme);
//   const securityIconColor = getSecurityIconColor(isActive, hasError);

//   return (
//     <Paper
//       elevation={2}
//       sx={{
//         position: 'absolute',
//         top: 16,
//         right: 16,
//         width: compact ? 280 : 340,
//         maxHeight: expanded ? '80vh' : 'auto',
//         overflow: 'hidden',
//         zIndex: 10,
//         backgroundColor:
//           theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.85)' : 'rgba(255, 255, 255, 0.95)',
//         backdropFilter: 'blur(8px)',
//         border: `1px solid ${borderColor}`,
//       }}
//     >
//       {/* Header */}
//       <Box
//         sx={{
//           display: 'flex',
//           alignItems: 'center',
//           justifyContent: JUSTIFY_SPACE_BETWEEN,
//           p: 1.5,
//           cursor: 'pointer',
//           '&:hover': { backgroundColor: theme.palette.action.hover },
//         }}
//         onClick={() => {
//           setExpanded(!expanded);
//         }}
//       >
//         <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//           <SecurityIcon color={securityIconColor} fontSize="small" />
//           <Typography variant="subtitle2" fontWeight="bold">
//             E2EE Status
//           </Typography>
//           <Chip
//             size="small"
//             icon={getStatusIcon(status)}
//             label={getStatusLabel(status)}
//             color={getStatusColor(status)}
//             sx={{ height: 22 }}
//           />
//         </Box>
//         <IconButton size="small">{expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}</IconButton>
//       </Box>

//       {/* Progress indicator for transitional states */}
//       {TRANSITIONAL_STATES.has(status) && <LinearProgress color="info" sx={{ height: 2 }} />}

//       {/* Expanded Content */}
//       <Collapse in={expanded}>
//         <Divider />

//         {/* Tabs */}
//         <Tabs
//           value={activeTab}
//           onChange={(_, newValue: number) => setActiveTab(newValue)}
//           variant="fullWidth"
//           sx={{
//             minHeight: 36,
//             '& .MuiTab-root': {
//               minHeight: 36,
//               fontSize: '0.75rem',
//               textTransform: 'none',
//             },
//           }}
//         >
//           <Tab icon={<SecurityIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="Status" />
//           <Tab icon={<ScienceIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="Tests" />
//         </Tabs>
//         <Divider />

//         {/* Tab Content */}
//         {activeTab === 0 && (
//           <Box sx={{ p: 1.5, maxHeight: '55vh', overflowY: 'auto' }}>
//             {/* Error Message */}
//             {errorMessage ? (
//               <Alert severity="error" sx={{ mb: 2, py: 0.5 }}>
//                 <Typography variant="caption">{errorMessage}</Typography>
//               </Alert>
//             ) : null}

//             {/* Browser Info */}
//             <Box sx={{ mb: 2 }}>
//               <Typography variant="caption" color={TEXT_SECONDARY} gutterBottom>
//                 Browser &amp; E2EE-Methode
//               </Typography>
//               <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 0.5 }}>
//                 <Chip
//                   size="small"
//                   label={`${browserInfo.name} ${browserInfo.majorVersion}`}
//                   variant="outlined"
//                 />
//                 <Chip
//                   size="small"
//                   label={e2eeCaps.method === 'none' ? 'Kein E2EE' : e2eeCaps.method}
//                   color={e2eeCaps.method === 'none' ? 'error' : 'success'}
//                   variant="outlined"
//                 />
//                 {browserInfo.isMobile ? (
//                   <Chip size="small" label="Mobile" variant="outlined" />
//                 ) : null}
//               </Box>
//             </Box>

//             {/* Video E2EE Section */}
//             <Box sx={{ mb: 2 }}>
//               <Typography
//                 variant="caption"
//                 color={TEXT_SECONDARY}
//                 gutterBottom
//                 sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
//               >
//                 <FingerprintIcon fontSize="inherit" />
//                 Video-Verschlüsselung
//               </Typography>

//               <FingerprintDisplay
//                 label="Dein Fingerprint:"
//                 fingerprint={localFingerprint}
//                 copyLabel="local"
//                 copied={copied}
//                 onCopy={handleCopy}
//                 activeColor="success.main"
//               />

//               <FingerprintDisplay
//                 label="Partner Fingerprint:"
//                 fingerprint={remoteFingerprint}
//                 copyLabel="remote"
//                 copied={copied}
//                 onCopy={handleCopy}
//                 activeColor="info.main"
//               />

//               {/* Key Generation */}
//               <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
//                 <KeyIcon fontSize="small" color="action" />
//                 <Typography variant="caption">
//                   Schlüssel-Generation: <strong>{keyGeneration}</strong>
//                 </Typography>
//                 {onRotateKeys && isActive ? (
//                   <Tooltip title="Schlüssel rotieren">
//                     <IconButton size="small" onClick={onRotateKeys}>
//                       <RefreshIcon fontSize="inherit" />
//                     </IconButton>
//                   </Tooltip>
//                 ) : null}
//               </Box>
//             </Box>

//             {/* Encryption Stats */}
//             {encryptionStats ? (
//               <EncryptionStatsSection
//                 encryptionStats={encryptionStats}
//                 encryptionHealth={encryptionHealth}
//               />
//             ) : null}

//             <Divider sx={{ my: 1.5 }} />

//             {/* Chat E2EE Section */}
//             <ChatE2EESection chatStatus={chatStatus} chatStats={chatStats} />

//             {/* Verification Hint */}
//             {isActive && localFingerprint && remoteFingerprint ? (
//               <Alert severity="info" sx={{ mt: 2, py: 0.5 }}>
//                 <Typography variant="caption">
//                   <strong>Verifikation:</strong> Vergleiche die Fingerprints mit deinem Partner über
//                   einen separaten Kanal (z.B. Telefon).
//                 </Typography>
//               </Alert>
//             ) : null}
//           </Box>
//         )}

//         {activeTab === 1 && (
//           <Box sx={{ maxHeight: '55vh', overflowY: 'auto' }}>
//             <E2EEVerificationTests compact={compact} />
//           </Box>
//         )}
//       </Collapse>
//     </Paper>
//   );
// };

// export default E2EEDebugPanel;
